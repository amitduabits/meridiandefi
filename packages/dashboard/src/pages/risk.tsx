import { Header } from "../components/layout/Header";
import { mockBreakers, mockPositions } from "../lib/mock-data";
import { ShieldCheck, ShieldAlert, ShieldOff, AlertTriangle, Shield, TrendingDown } from "lucide-react";

export function RiskPage() {
  const totalValue = mockPositions.reduce((s, p) => s + p.valueUsd, 0);
  const closedCount = mockBreakers.filter((b) => b.status === "CLOSED").length;

  return (
    <div className="min-h-screen">
      <Header title="Risk Dashboard" />
      <div className="p-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className="card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Circuit Breakers</p>
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                closedCount === mockBreakers.length ? "bg-emerald-500/10" : "bg-amber-500/10"
              }`}>
                {closedCount === mockBreakers.length ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-bold tracking-tight tabular-nums">{closedCount}</span>
              <span className="text-[13px] text-slate-500">/ {mockBreakers.length} clear</span>
            </div>
          </div>

          <div className="card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Portfolio Exposure</p>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                <Shield className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-[22px] font-bold tracking-tight tabular-nums">${totalValue.toLocaleString()}</span>
            <div className="progress-bar mt-3">
              <div className="progress-bar__fill bg-indigo-500" style={{ width: "68%" }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">68% of max exposure limit</p>
          </div>

          <div className="card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Daily Drawdown</p>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                <TrendingDown className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-[22px] font-bold tracking-tight tabular-nums text-emerald-400">-0.8%</span>
            <div className="progress-bar mt-3">
              <div className="progress-bar__fill bg-emerald-500" style={{ width: "8%" }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">8% of -10% limit</p>
          </div>
        </div>

        {/* Circuit Breakers */}
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E293B]/60">
            <h3 className="text-[13px] font-semibold text-white/80">Circuit Breakers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 stagger-children">
            {mockBreakers.map((b) => (
              <BreakerCard key={b.type} breaker={b} />
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E293B]/60">
            <h3 className="text-[13px] font-semibold text-white/80">Recent Risk Events</h3>
          </div>
          <div className="divide-y divide-[#1E293B]/40">
            <AlertRow
              time="15 min ago"
              message="GAS_SPIKE circuit breaker tripped — gas >500 gwei on Ethereum"
              severity="warning"
            />
            <AlertRow
              time="3 days ago"
              message="FLASH_CRASH circuit breaker triggered — ETH dropped 12% in 5 min"
              severity="danger"
            />
            <AlertRow
              time="5 days ago"
              message="Daily trade limit reached for agent DeFi Rebalancer (50/50)"
              severity="info"
            />
            <AlertRow
              time="1 week ago"
              message="Position size warning: agent Arbitrage Hunter at 82% of max position"
              severity="warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakerCard({ breaker }: { breaker: typeof mockBreakers[number] }) {
  const statusConfig = {
    CLOSED: {
      icon: ShieldCheck,
      color: "text-emerald-400",
      dotClass: "bg-emerald-400",
      bg: "bg-emerald-500/[0.04]",
      border: "border-emerald-500/10",
      label: "Closed",
    },
    OPEN: {
      icon: ShieldOff,
      color: "text-red-400",
      dotClass: "bg-red-400",
      bg: "bg-red-500/[0.04]",
      border: "border-red-500/10",
      label: "Open",
    },
    HALF_OPEN: {
      icon: ShieldAlert,
      color: "text-amber-400",
      dotClass: "bg-amber-400",
      bg: "bg-amber-500/[0.04]",
      border: "border-amber-500/10",
      label: "Half-Open",
    },
  };
  const config = statusConfig[breaker.status];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all duration-200 hover:border-opacity-50`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          {breaker.type.replace(/_/g, " ")}
        </span>
        <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className={`block w-2 h-2 rounded-full ${config.dotClass}`} />
          {breaker.status !== "CLOSED" && (
            <span className={`absolute inset-0 rounded-full ${config.dotClass} animate-ping opacity-40`} />
          )}
        </div>
        <span className={`text-[13px] font-semibold ${config.color}`}>{config.label}</span>
      </div>
      {breaker.tripCount > 0 && (
        <p className="text-[11px] text-slate-500 mt-2">
          Tripped {breaker.tripCount}x
          {breaker.lastTripped && ` · Last: ${new Date(breaker.lastTripped).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}

function AlertRow({ time, message, severity }: { time: string; message: string; severity: "info" | "warning" | "danger" }) {
  const config = {
    info: { color: "text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-400" },
    warning: { color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-400" },
    danger: { color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
  };
  const c = config[severity];

  return (
    <div className="flex items-start gap-3.5 px-6 py-4 table-row">
      <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.bg} mt-0.5 shrink-0`}>
        <AlertTriangle className={`w-3.5 h-3.5 ${c.color}`} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white/80 leading-relaxed">{message}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
