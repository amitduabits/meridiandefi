import { useState } from "react";
import { Header } from "../components/layout/Header";
import { mockTransactions } from "../lib/mock-data";
import { ExternalLink, Search, Filter } from "lucide-react";

export function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState<string>("all");

  const filtered = mockTransactions.filter((tx) => {
    if (chainFilter !== "all" && tx.chain !== chainFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.txHash.toLowerCase().includes(q) ||
        tx.agentName.toLowerCase().includes(q) ||
        tx.action.toLowerCase().includes(q) ||
        tx.tokenIn.toLowerCase().includes(q) ||
        tx.tokenOut.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const chains = [...new Set(mockTransactions.map((t) => t.chain))];

  return (
    <div className="min-h-screen">
      <Header title="Transactions" />
      <div className="p-8 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tx hash, agent, token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-[#1E293B] rounded-xl text-[13px] text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:bg-white/[0.04] transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2.5 bg-white/[0.03] border border-[#1E293B] rounded-xl text-[13px] text-slate-300 focus:border-indigo-500/30 focus:outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="all">All Chains</option>
              {chains.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <span className="text-[12px] text-slate-500 tabular-nums">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="card-static overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B]/40">
                  <th className="text-left px-6 py-3 font-medium">Time</th>
                  <th className="text-left px-6 py-3 font-medium">Agent</th>
                  <th className="text-left px-6 py-3 font-medium">Chain</th>
                  <th className="text-left px-6 py-3 font-medium">Action</th>
                  <th className="text-left px-6 py-3 font-medium">Pair</th>
                  <th className="text-right px-6 py-3 font-medium">Value</th>
                  <th className="text-right px-6 py-3 font-medium">Gas</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-center px-6 py-3 font-medium">Tx</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((tx) => (
                  <tr key={tx.id} className="table-row border-b border-[#1E293B]/30 last:border-0">
                    <td className="px-6 py-3.5 text-slate-500 text-[12px] tabular-nums">
                      {new Date(tx.timestamp).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-white/85 font-medium">{tx.agentName}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04] text-[11px] text-slate-400">
                        {tx.chain}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/[0.08] border border-indigo-500/10 text-[11px] font-medium text-indigo-300/80">
                        {tx.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300 tabular-nums">{tx.tokenIn}/{tx.tokenOut}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-medium text-white/85">${tx.valueUsd.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-500">${tx.gasCostUsd.toFixed(3)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all duration-200">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
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

function StatusBadge({ status }: { status: "success" | "failed" | "pending" }) {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10",
    failed: "bg-red-500/10 text-red-400 border border-red-500/10",
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${styles[status]}`}>
      <span className={`w-1 h-1 rounded-full ${
        status === "success" ? "bg-emerald-400" : status === "failed" ? "bg-red-400" : "bg-amber-400"
      }`} />
      {status}
    </span>
  );
}
