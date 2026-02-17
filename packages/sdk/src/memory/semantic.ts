// ---------------------------------------------------------------------------
// Semantic memory — Qdrant vector store for long-term knowledge retrieval.
// ---------------------------------------------------------------------------

import { QdrantClient } from "@qdrant/js-client-rest";
import type pino from "pino";
import { createLogger } from "../core/logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SemanticEntry {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface ISemanticMemory {
  store(content: string, metadata: Record<string, unknown>): Promise<string>;
  search(query: string, topK?: number): Promise<SemanticSearchResult[]>;
  searchSimilarDecisions(context: string, topK?: number): Promise<SemanticSearchResult[]>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

// ---------------------------------------------------------------------------
// Simple embedding function — a lightweight hash-based embedding
// for development. In production, replace with a real embedding model.
// ---------------------------------------------------------------------------

/**
 * Generate a simple deterministic embedding from text.
 * This is a placeholder — in production, use @xenova/transformers
 * with all-MiniLM-L6-v2 or call an embedding API.
 */
export function simpleEmbed(text: string, dims = 384): number[] {
  const embedding = new Array<number>(dims).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % dims;
    embedding[idx] = (embedding[idx]! + charCode / 127) / 2;
  }

  // L2 normalize.
  let norm = 0;
  for (const v of embedding) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) {
      embedding[i] = embedding[i]! / norm;
    }
  }

  return embedding;
}

// ---------------------------------------------------------------------------
// Embedder interface — allows swapping the embedding function.
// ---------------------------------------------------------------------------

export interface IEmbedder {
  embed(text: string): Promise<number[]>;
  readonly dims: number;
}

export class SimpleEmbedder implements IEmbedder {
  readonly dims = 384;
  async embed(text: string): Promise<number[]> {
    return simpleEmbed(text, this.dims);
  }
}

// ---------------------------------------------------------------------------
// QdrantSemanticMemory
// ---------------------------------------------------------------------------

export class QdrantSemanticMemory implements ISemanticMemory {
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private readonly embedder: IEmbedder;
  private readonly log: pino.Logger;
  private initialized = false;

  constructor(opts: {
    url?: string;
    collectionName?: string;
    embedder?: IEmbedder;
    logger?: pino.Logger;
    /** Pre-configured Qdrant client (for testing). */
    client?: QdrantClient;
  }) {
    this.client = opts.client ?? new QdrantClient({ url: opts.url ?? "http://localhost:6333" });
    this.collectionName = opts.collectionName ?? "meridian_memory";
    this.embedder = opts.embedder ?? new SimpleEmbedder();
    this.log = opts.logger ?? createLogger({ module: "semantic-memory" });
  }

  /** Ensure the collection exists, creating it if needed. */
  async ensureCollection(): Promise<void> {
    if (this.initialized) return;

    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.embedder.dims,
            distance: "Cosine",
          },
        });
        this.log.info({ collection: this.collectionName }, "Qdrant collection created");
      }

      this.initialized = true;
    } catch (err) {
      this.log.warn({ err }, "Failed to ensure Qdrant collection — operations may fail");
    }
  }

  async store(content: string, metadata: Record<string, unknown>): Promise<string> {
    await this.ensureCollection();

    const id = crypto.randomUUID();
    const embedding = await this.embedder.embed(content);

    await this.client.upsert(this.collectionName, {
      points: [
        {
          id,
          vector: embedding,
          payload: { content, ...metadata, stored_at: Date.now() },
        },
      ],
    });

    this.log.debug({ id, contentLength: content.length }, "Semantic entry stored");
    return id;
  }

  async search(query: string, topK = 5): Promise<SemanticSearchResult[]> {
    await this.ensureCollection();

    const queryEmbedding = await this.embedder.embed(query);

    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
    });

    return results.map((r) => ({
      id: String(r.id),
      content: String((r.payload as Record<string, unknown>)?.["content"] ?? ""),
      metadata: (r.payload ?? {}) as Record<string, unknown>,
      score: r.score,
    }));
  }

  async searchSimilarDecisions(context: string, topK = 5): Promise<SemanticSearchResult[]> {
    return this.search(context, topK);
  }

  async delete(id: string): Promise<void> {
    await this.ensureCollection();
    await this.client.delete(this.collectionName, {
      points: [id],
    });
    this.log.debug({ id }, "Semantic entry deleted");
  }

  async count(): Promise<number> {
    await this.ensureCollection();
    const info = await this.client.getCollection(this.collectionName);
    return info.points_count ?? 0;
  }
}
