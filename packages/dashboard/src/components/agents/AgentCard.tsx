import { Clock, TrendingUp, TrendingDown, Pause, Play, Square, Zap, RotateCw } from "lucide-react";
import type { MockAgent } from "../../lib/mock-data";
import { stateBgColor, stateDotClass, stateIsActive } from "../../lib/mock-data";

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatUptime(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export function AgentCard({ agent }: { agent: MockAgent }) {
  const isPositive = agent.pnlPct >= 0;
  const isActive = stateIsActive(agent.state);

  return (
    <div className="group card p-0 overflow-hidden">
      {/* Top gradient accent line */}
      <div className={`h-[2px] w-full ${
        agent.state === "ERROR" ? "bg-gradient-to-r from-red-500/60 via-red-400/40 to-transparent" :
        agent.state === "PAUSED" ? "bg-gradient-to-r from-slate-500/40 via-slate-400/20 to-transparent" :
        "bg-gradient-to-r from-indigo-500/60 via-purple-500/40 to-transparent"
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* State dot with pulse */}
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${stateDotClass(agent.state)}`} />
              {isActive && (
                <div className={`absolute inset-0 rounded-full ${stateDotClass(agent.state)} animate-ping opacity-40`} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[14px] text-white/90">{agent.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{agent.strategy}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${stateBgColor(agent.state)}`}>
            {agent.state}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Portfolio</p>
            <p className="text-[18px] font-semibold tracking-tight text-white/95 tabular-nums">
              ${agent.portfolioValue.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">PnL</p>
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-md ${
                isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
              </div>
              <span className={`text-[18px] font-semibold tracking-tight tabular-nums ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}>
                {isPositive ? "+" : ""}{agent.pnlPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-1 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] text-[11px] text-slate-500">
            <Clock className="w-3 h-3" />
            {formatTime(Date.now() - agent.lastActionTime)}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] text-[11px] text-slate-500">
            <RotateCw className="w-3 h-3" />
            {agent.cycleCount.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] text-[11px] text-slate-500">
            <Zap className="w-3 h-3" />
            {formatUptime(agent.uptime)}
          </span>
        </div>

        {/* Chains */}
        <div className="flex items-center gap-1.5 mb-4">
          {agent.chains.map((chain) => (
            <span key={chain} className="px-2 py-0.5 rounded-md bg-indigo-500/[0.06] border border-indigo-500/10 text-[11px] font-medium text-indigo-300/70">
              {chain}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#1E293B]/60">
          {agent.state === "PAUSED" ? (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/15 hover:border-emerald-500/25 transition-all duration-200">
              <Play className="w-3 h-3" /> Resume
            </button>
          ) : (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[11px] font-semibold hover:bg-amber-500/15 hover:border-amber-500/25 transition-all duration-200">
              <Pause className="w-3 h-3" /> Pause
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/[0.08] border border-red-500/10 text-red-400/80 text-[11px] font-semibold hover:bg-red-500/15 hover:border-red-500/20 hover:text-red-400 transition-all duration-200">
            <Square className="w-3 h-3" /> Stop
          </button>
        </div>
      </div>
    </div>
  );
}
