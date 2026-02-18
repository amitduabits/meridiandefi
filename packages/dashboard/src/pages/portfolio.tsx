import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import { EquityCurve } from "../components/charts/EquityCurve";
import { AllocationPie } from "../components/charts/AllocationPie";
import { mockPositions, mockPnlData, type MockPosition } from "../lib/mock-data";
import { fetchPortfolio, type PortfolioSnapshot } from "../lib/api.js";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Layers } from "lucide-react";

function DataSourceBadge({ source }: { source: "live" | "mock" | "loading" }) {
  if (source === "loading") return null;
  if (source === "live") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Mock Data
    </span>
  );
}

function portfolioToPositions(snapshot: PortfolioSnapshot): MockPosition[] {
  return snapshot.tokens.map((t) => ({
    token: t.symbol,
    chain: "Arbitrum Sepolia",
    amount: Number(t.balance),
    valueUsd: t.valueUsd,
    pnlUsd: 0,
    pnlPct: 0,
    protocol: "Wallet",
  }));
}

export function PortfolioPage() {
  const [dataSource, setDataSource] = useState<"live" | "mock" | "loading">("loading");
  const [positions, setPositions] = useState<MockPosition[]>(mockPositions);
  const [pnlData, setPnlData] = useState(mockPnlData);

  useEffect(() => {
    fetchPortfolio().then((data) => {
      if (data) {
        setPositions(portfolioToPositions(data));
        if (data.equityCurve.length > 0) {
          setPnlData(data.equityCurve.map((p) => ({ timestamp: p.timestamp, value: p.value, pnl: 0 })));
        }
        setDataSource("live");
      } else {
        setDataSource("mock");
      }
    });
  }, []);

  const totalValue = positions.reduce((s, p) => s + p.valueUsd, 0);
  const totalPnl = positions.reduce((s, p) => s + p.pnlUsd, 0);
  const totalPnlPct = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const isPositive = totalPnl >= 0;

  const byChain = new Map<string, number>();
  for (const p of positions) {
    byChain.set(p.chain, (byChain.get(p.chain) ?? 0) + p.valueUsd);
  }

  return (
    <div className="min-h-screen">
      <Header title="Portfolio" />
      <div className="p-8 space-y-6">
        {/* Summary cards */}
        <div className="flex items-center justify-between mb-1">
          <DataSourceBadge source={dataSource} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            icon={<DollarSign className="w-4 h-4" strokeWidth={1.5} />}
            iconBg="bg-indigo-500/10 text-indigo-400"
          />
          <StatCard
            label="Total PnL"
            value={`${isPositive ? "+" : ""}$${Math.abs(totalPnl).toLocaleString()}`}
            valueColor={isPositive ? "text-emerald-400" : "text-red-400"}
            icon={isPositive ? <TrendingUp className="w-4 h-4" strokeWidth={1.5} /> : <TrendingDown className="w-4 h-4" strokeWidth={1.5} />}
            iconBg={isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}
          />
          <StatCard
            label="Return"
            value={`${isPositive ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
            valueColor={isPositive ? "text-emerald-400" : "text-red-400"}
            icon={<BarChart3 className="w-4 h-4" strokeWidth={1.5} />}
            iconBg={isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}
          />
          <StatCard
            label="Positions"
            value={String(positions.length)}
            icon={<Layers className="w-4 h-4" strokeWidth={1.5} />}
            iconBg="bg-violet-500/10 text-violet-400"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card-static p-6">
            <h3 className="text-[13px] font-semibold text-white/80 mb-5">Equity Curve (30d)</h3>
            <EquityCurve data={pnlData} />
          </div>
          <div className="card-static p-6">
            <h3 className="text-[13px] font-semibold text-white/80 mb-4">Allocation</h3>
            <AllocationPie positions={positions} />
            <div className="mt-5 space-y-2.5 pt-4 border-t border-[#1E293B]/60">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">By Chain</p>
              {[...byChain.entries()].sort((a, b) => b[1] - a[1]).map(([chain, value]) => {
                const pct = totalValue > 0 ? ((value / totalValue) * 100).toFixed(0) : "0";
                return (
                  <div key={chain} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400">{chain}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#1E293B] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500/50 progress-bar__fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[12px] text-slate-500 tabular-nums w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Positions table */}
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E293B]/60">
            <h3 className="text-[13px] font-semibold text-white/80">Positions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B]/40">
                  <th className="text-left px-6 py-3 font-medium">Token</th>
                  <th className="text-left px-6 py-3 font-medium">Chain</th>
                  <th className="text-right px-6 py-3 font-medium">Amount</th>
                  <th className="text-right px-6 py-3 font-medium">Value</th>
                  <th className="text-right px-6 py-3 font-medium">PnL</th>
                  <th className="text-left px-6 py-3 font-medium">Protocol</th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .slice()
                  .sort((a, b) => b.valueUsd - a.valueUsd)
                  .map((p, i) => (
                  <tr key={i} className="table-row border-b border-[#1E293B]/30 last:border-0">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-white/90">{p.token}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04] text-[11px] text-slate-400">
                        {p.chain}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-300">{p.amount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-medium text-white/85">${p.valueUsd.toLocaleString()}</td>
                    <td className={`px-6 py-3.5 text-right tabular-nums font-medium ${p.pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-[12px]">{p.protocol}</td>
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

function StatCard({
  label,
  value,
  valueColor,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="card-static p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      <span className={`text-[22px] font-bold tracking-tight tabular-nums ${valueColor ?? "text-white/95"}`}>
        {value}
      </span>
    </div>
  );
}
