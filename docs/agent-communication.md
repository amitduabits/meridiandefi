# Agent Communication

Meridian agents can discover, communicate with, and delegate tasks to other agents via a peer-to-peer messaging layer built on libp2p. This document describes the discovery mechanism, messaging protocol, task negotiation flow, and how to set up multi-agent systems.

## Overview

The agent communication layer provides:

- **Peer discovery** via Kademlia DHT -- agents find each other by advertising capabilities
- **Pub/sub messaging** via GossipSub -- broadcast signals and market data to interested peers
- **Direct messaging** -- point-to-point communication for task negotiation
- **Protobuf serialization** -- efficient, typed message encoding

```
┌──────────┐     GossipSub      ┌──────────┐
│  Agent A  │ ◄──────────────► │  Agent B  │
│ (Analyst) │                   │  (Risk)   │
└─────┬─────┘                   └─────┬─────┘
      │          Kademlia DHT          │
      │     ┌──────────────────┐       │
      └────►│    DHT Network    │◄─────┘
            └────────┬─────────┘
                     │
               ┌─────▼─────┐
               │  Agent C   │
               │ (Executor) │
               └────────────┘
```

## Peer Discovery

Agents register themselves on the Kademlia DHT with their capabilities and metadata. Other agents can query the DHT to find peers with specific capabilities.

### Advertising Capabilities

When an agent starts, it advertises its capabilities from the `AgentConfig`:

```typescript
const agent = new Agent({
  name: "Risk Assessor",
  capabilities: ["RISK_ASSESSMENT", "MARKET_ANALYSIS"],
  chains: [1, 42161],
  // ...
}, deps);
```

The available capabilities are defined by the `AgentCapability` enum:

| Capability | Description |
|------------|-------------|
| `SWAP` | Can execute token swaps |
| `PROVIDE_LIQUIDITY` | Can manage LP positions |
| `LEND_BORROW` | Can interact with lending protocols |
| `STAKE` | Can stake tokens |
| `BRIDGE` | Can bridge tokens cross-chain |
| `ARBITRAGE` | Can identify and execute arbitrage opportunities |
| `MARKET_ANALYSIS` | Can analyze market data and produce signals |
| `RISK_ASSESSMENT` | Can evaluate risk of proposed actions |
| `PORTFOLIO_MANAGEMENT` | Can manage multi-asset portfolios |

### Finding Peers

Query the DHT to find agents with specific capabilities:

```typescript
// Find all agents that can assess risk
const riskAgents = await discovery.findAgents("RISK_ASSESSMENT");

// Returns agent metadata: id, capabilities, chains, endpoint
```

The on-chain `AgentRegistry` contract (see [Smart Contracts](smart-contracts.md)) provides a complementary discovery mechanism where agents are indexed by capability on-chain.

## GossipSub Messaging

GossipSub is used for topic-based pub/sub messaging. Agents subscribe to topics of interest and receive messages from all publishers on those topics.

### Topics

Standard topics follow the naming convention `meridian/{category}/{specifics}`:

| Topic | Purpose | Publishers |
|-------|---------|------------|
| `meridian/signals/{chainId}` | Trade signals for a chain | Analyst agents |
| `meridian/risk/{agentId}` | Risk alerts for an agent | Risk managers |
| `meridian/market/{chainId}` | Market data broadcasts | Data feed agents |
| `meridian/tasks/available` | Available task announcements | Any agent |
| `meridian/tasks/results` | Task completion results | Executor agents |

### Publishing

```typescript
// Broadcast a trade signal
await pubsub.publish("meridian/signals/42161", {
  type: "TRADE_SIGNAL",
  payload: {
    token: "ETH",
    direction: "BUY",
    confidence: 0.72,
    reasoning: "RSI oversold, strong support at 3200",
    suggestedSizePct: 5,
  },
  sender: agentId,
  timestamp: Date.now(),
});
```

### Subscribing

```typescript
pubsub.subscribe("meridian/signals/42161", (message) => {
  const signal = message.payload;
  // Process the trade signal...
});
```

## Protobuf Message Format

All P2P messages are serialized with Protocol Buffers for efficiency and type safety. The schemas are defined in `packages/proto`.

### Core Message Envelope

```protobuf
message MeridianMessage {
  string sender_id = 1;
  string recipient_id = 2;    // empty for broadcasts
  uint64 timestamp = 3;
  string message_type = 4;
  bytes payload = 5;
  string signature = 6;       // ed25519 signature
}
```

### Trade Signal

```protobuf
message TradeSignal {
  string token = 1;
  Direction direction = 2;
  double confidence = 3;
  string reasoning = 4;
  double suggested_size_pct = 5;
  uint32 chain_id = 6;

  enum Direction {
    BUY = 0;
    SELL = 1;
  }
}
```

### Task Request

```protobuf
message TaskRequest {
  string task_id = 1;
  string task_type = 2;
  bytes parameters = 3;
  uint64 deadline = 4;
  string required_capability = 5;
}
```

## Task Negotiation Protocol

Agents can delegate specialized work to peers through a structured negotiation flow:

```
Requester                          Provider
    │                                  │
    │──── TaskRequest ────────────────►│
    │                                  │
    │◄─── TaskAccept / TaskReject ─────│
    │                                  │
    │     (provider executes task)     │
    │                                  │
    │◄─── TaskResult ─────────────────│
    │                                  │
    │──── TaskAcknowledge ────────────►│
```

### Step 1: Request

The requesting agent broadcasts a task request or sends it directly to a known peer:

```typescript
await negotiation.requestTask({
  taskId: crypto.randomUUID(),
  taskType: "RISK_ASSESSMENT",
  parameters: {
    action: "SWAP",
    tradeValueUsd: 50_000,
    estimatedSlippageBps: 45,
  },
  deadline: Date.now() + 30_000, // 30 second deadline
  requiredCapability: "RISK_ASSESSMENT",
});
```

### Step 2: Accept or Reject

The provider evaluates whether it can handle the request:

```typescript
negotiation.onTaskRequest(async (request) => {
  if (canHandle(request)) {
    await negotiation.acceptTask(request.taskId);
    const result = await executeTask(request);
    await negotiation.submitResult(request.taskId, result);
  } else {
    await negotiation.rejectTask(request.taskId, "At capacity");
  }
});
```

### Step 3: Result

The provider submits the task result, and the requester acknowledges receipt.

## Multi-Agent Patterns

### Analyst-Risk-Executor Pipeline

The most common multi-agent pattern, demonstrated in the `multi-agent-portfolio` example:

1. **Market Analyst** scans markets and produces trade signals via the EventBus
2. **Risk Manager** evaluates each signal against risk limits and circuit breakers
3. **Executor** plans and executes approved trades on-chain

```typescript
const bus = new EventBus();
const analyst = new MarketAnalyst(bus);
const riskManager = new RiskManager();
const executor = new Executor();

// Analyst produces signals
const signals = await analyst.analyze(snapshot);

// Risk manager evaluates each signal
for (const signal of signals) {
  const evaluation = riskManager.evaluate(signal, exposure, drawdown, gas);
  if (evaluation.approved) {
    const result = await executor.execute(signal, evaluation, dryRun);
  }
}
```

### Consensus-Based Decisions

Multiple analyst agents evaluate the same market data independently. A coordinator agent collects their signals and only acts when a quorum agrees:

```
  Analyst A ──┐
              ├──► Coordinator ──► Executor
  Analyst B ──┤       (2/3 quorum)
              │
  Analyst C ──┘
```

### Specialist Delegation

A portfolio management agent delegates specialized tasks to specialist agents based on the action type:

```
Portfolio Manager
    ├── "Need Uniswap swap" ──► DEX Specialist
    ├── "Need Aave borrow" ──► Lending Specialist
    └── "Need risk check" ──► Risk Specialist
```

## EventBus Integration

Within a single process, agents communicate through the `EventBus` without network overhead:

```typescript
import { EventBus } from "@meridian/sdk";

const bus = new EventBus();

// Agent A publishes a decision
bus.emit("agent:decision", {
  agentId: "analyst-001",
  record: decisionRecord,
});

// Agent B listens for decisions
bus.on("agent:decision", ({ agentId, record }) => {
  if (agentId.startsWith("analyst-")) {
    // Process the analyst's recommendation
  }
});
```

The `EventBus` supports all Meridian event types including `agent:trade`, `agent:error`, `market:snapshot`, and `agent:cycleComplete`. See [Architecture](architecture.md) for the full event catalog.

## Security Considerations

- All P2P messages are signed with ed25519 keys. Unsigned or incorrectly signed messages are dropped.
- The on-chain `AgentRegistry` can be used to verify that a peer's agent ID corresponds to a registered on-chain identity (ERC-721 token).
- Task delegation respects the risk module -- even if a peer requests an action, the local risk manager still validates it before execution.
- Rate limiting is applied per-peer to prevent message flooding.
