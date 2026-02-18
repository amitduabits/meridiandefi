import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import { AgentCard } from "../components/agents/AgentCard";
import { mockAgents, stateIsActive, type MockAgent } from "../lib/mock-data";
import { fetchAgentStatus, type AgentStatus } from "../lib/api.js";
import { Plus, Bot } from "lucide-react";

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

function agentStatusToMock(status: AgentStatus): MockAgent {
  return {
    id: status.id,
    name: status.name,
    state: status.state as MockAgent["state"],
    strategy: status.strategy,
    chains: ["Arbitrum Sepolia"],
    lastAction: status.lastDecision?.action ?? "HOLD",
    lastActionTime: status.lastDecision?.timestamp ?? Date.now(),
    cycleCount: status.totalTrades,
    uptime: status.uptime,
    pnlPct: 0,
    portfolioValue: Object.values(status.currentAllocation).reduce((a, b) => a + b, 0),
  };
}

export function AgentsPage() {
  const [dataSource, setDataSource] = useState<"live" | "mock" | "loading">("loading");
  const [agents, setAgents] = useState<MockAgent[]>(mockAgents);

  useEffect(() => {
    fetchAgentStatus().then((data) => {
      if (data) {
        const liveAgent = agentStatusToMock(data);
        // Show live agent first, then remaining mock agents as demos
        setAgents([liveAgent, ...mockAgents.slice(1)]);
        setDataSource("live");
      } else {
        setAgents(mockAgents);
        setDataSource("mock");
      }
    });
  }, []);

  const activeCount = agents.filter((a) => stateIsActive(a.state)).length;
  const totalValue = agents.reduce((s, a) => s + a.portfolioValue, 0);

  return (
    <div className="min-h-screen">
      <Header title="Agents" />
      <div className="p-8">
        {/* Summary bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/10">
                <Bot className="w-5 h-5 text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums">{agents.length}</span>
                  <span className="text-[13px] text-slate-500">agents</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {activeCount} active
                  </span>
                  <span className="text-[12px] text-slate-500">
                    ${totalValue.toLocaleString()} managed
                  </span>
                </div>
              </div>
            </div>
            <DataSourceBadge source={dataSource} />
          </div>

          <button className="group flex items-center gap-2.5 pl-3.5 pr-4.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[13px] font-semibold shadow-[0_1px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_1px_20px_rgba(99,102,241,0.35)] hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200">
            <Plus className="w-4 h-4" strokeWidth={2} />
            New Agent
          </button>
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
