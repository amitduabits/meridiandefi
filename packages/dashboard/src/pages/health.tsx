import { Header } from "../components/layout/Header";
import { mockSystemHealth } from "../lib/mock-data";
import { Circle, Cpu, Database, Brain, Wifi, Zap, DollarSign, Clock } from "lucide-react";

export function HealthPage() {
  const { rpcStatus, llmUsage, services } = mockSystemHealth;

  return (
    <div className="min-h-screen">
      <Header title="System Health" />
      <div className="p-8 space-y-6">
        {/* Service Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          {Object.entries(services).map(([name, svc]) => (
            <ServiceCard key={name} name={name} status={svc.status} latencyMs={svc.latencyMs} />
          ))}
        </div>

        {/* RPC Status */}
        <div className="card-static overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-[#1E293B]/60 flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10">
              <Wifi className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80">RPC Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B]/40">
                  <th className="text-left px-6 py-3 font-medium">Chain</th>
                  <th className="text-left px-6 py-3 font-medium">Chain ID</th>
                  <th className="text-right px-6 py-3 font-medium">Latency</th>
                  <th className="text-right px-6 py-3 font-medium">Last Block</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rpcStatus.map((rpc) => (
                  <tr key={rpc.chainId} className="table-row border-b border-[#1E293B]/30 last:border-0">
                    <td className="px-6 py-3.5 font-medium text-white/85">{rpc.chain}</td>
                    <td className="px-6 py-3.5 text-slate-500 tabular-nums">{rpc.chainId}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-1 rounded-full bg-[#1E293B] overflow-hidden">
                          <div
                            className={`h-full rounded-full progress-bar__fill ${rpc.latencyMs > 200 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min((rpc.latencyMs / 500) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`tabular-nums font-medium ${rpc.latencyMs > 200 ? "text-amber-400" : "text-emerald-400"}`}>
                          {rpc.latencyMs}ms
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">
                      #{rpc.lastBlock.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                        rpc.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          rpc.status === "healthy" ? "bg-emerald-400" : "bg-amber-400"
                        }`} />
                        {rpc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LLM Usage */}
        <div className="card-static overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="px-6 py-4 border-b border-[#1E293B]/60 flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10">
              <Brain className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80">LLM Usage</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <LlmStat
                label="Total Tokens"
                value={`${(llmUsage.totalTokens / 1_000_000).toFixed(2)}M`}
                icon={<Zap className="w-3.5 h-3.5" strokeWidth={1.5} />}
                iconBg="bg-violet-500/10 text-violet-400"
              />
              <LlmStat
                label="Total Cost"
                value={`$${llmUsage.totalCostUsd.toFixed(2)}`}
                icon={<DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />}
                iconBg="bg-emerald-500/10 text-emerald-400"
              />
              <LlmStat
                label="Requests Today"
                value={String(llmUsage.requestsToday)}
                icon={<Brain className="w-3.5 h-3.5" strokeWidth={1.5} />}
                iconBg="bg-blue-500/10 text-blue-400"
              />
              <LlmStat
                label="Avg Latency"
                value={`${llmUsage.avgLatencyMs}ms`}
                icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.5} />}
                iconBg="bg-amber-500/10 text-amber-400"
              />
            </div>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B]/40">
                  <th className="text-left pb-3 font-medium">Provider</th>
                  <th className="text-right pb-3 font-medium">Requests</th>
                  <th className="text-right pb-3 font-medium">Tokens</th>
                  <th className="text-right pb-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {llmUsage.providers.map((p) => (
                  <tr key={p.name} className="table-row border-b border-[#1E293B]/30 last:border-0">
                    <td className="py-3 font-medium text-white/85">{p.name}</td>
                    <td className="py-3 text-right text-slate-500 tabular-nums">{p.requests}</td>
                    <td className="py-3 text-right text-slate-500 tabular-nums">{(p.tokens / 1000).toFixed(0)}k</td>
                    <td className="py-3 text-right font-medium text-white/85 tabular-nums">${p.costUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ name, status, latencyMs }: { name: string; status: string; latencyMs: number }) {
  const icons: Record<string, typeof Database> = { redis: Database, postgres: Database, qdrant: Cpu };
  const Icon = icons[name] ?? Database;
  const isConnected = status === "connected";

  return (
    <div className="card-static p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04]">
            <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </div>
          <span className="text-[13px] font-semibold capitalize text-white/85">{name}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
          isConnected
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
            : "bg-red-500/10 text-red-400 border border-red-500/10"
        }`}>
          <span className={`w-1 h-1 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-20 h-1 rounded-full bg-[#1E293B] overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500/60 progress-bar__fill" style={{ width: `${Math.min(latencyMs * 5, 100)}%` }} />
        </div>
        <span className="text-[11px] text-slate-500 tabular-nums">{latencyMs}ms</span>
      </div>
    </div>
  );
}

function LlmStat({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-[#1E293B]/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center justify-center w-6 h-6 rounded-md ${iconBg}`}>
          {icon}
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <span className="text-[17px] font-bold tracking-tight tabular-nums text-white/90">{value}</span>
    </div>
  );
}
