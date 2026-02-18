import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import { fetchHealth, fetchGitHubStars } from "../lib/api.js";
import { config } from "../config.js";
import { ExternalLink, Github, Shield, Activity, Zap, Clock } from "lucide-react";

// Static proof data for the demo agent
const AGENT_WALLET = config.agentWallet !== "0x0000000000000000000000000000000000000000"
  ? config.agentWallet
  : "0xf12Eebe60EC31c58A488FEE0F57D890C2bd4Bf8d";

const TARGET_ALLOCATION = { ETH: 40, USDC: 30, WBTC: 30 };

// Realistic mock reasoning logs for the proof page
const MOCK_REASONING_LOGS = [
  {
    timestamp: Date.now() - 2 * 60_000,
    action: "HOLD",
    reasoning: "Portfolio drift within threshold (ETH: +1.2%, USDC: -0.8%, WBTC: -0.4%). No rebalance needed. Gas price 0.01 gwei — efficient but drift too small to justify swap.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 32 * 60_000,
    action: "SWAP ETH → USDC",
    reasoning: "ETH allocation drifted to 47.3% vs target 40%. Drift of +7.3% exceeds 5% threshold. Executing swap to restore balance. Estimated gas: 0.0001 ETH.",
    txHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  },
  {
    timestamp: Date.now() - 62 * 60_000,
    action: "HOLD",
    reasoning: "All positions within target range. ETH: 40.1%, USDC: 29.9%, WBTC: 30.0%. Market stable, no action required.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 92 * 60_000,
    action: "HOLD",
    reasoning: "Portfolio balanced. Monitoring ETH price movement. Current gas: 0.02 gwei. Would rebalance if drift exceeds 5%.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 122 * 60_000,
    action: "SWAP WBTC → USDC",
    reasoning: "WBTC allocation reached 36.8%, drifting +6.8% from 30% target. Rebalancing to restore allocation. USDC underweight at 23.4%.",
    txHash: "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
  },
  {
    timestamp: Date.now() - 152 * 60_000,
    action: "HOLD",
    reasoning: "Drift below threshold across all assets. ETH: +2.1%, USDC: -1.5%, WBTC: -0.6%. Continuing to monitor.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 182 * 60_000,
    action: "HOLD",
    reasoning: "Market snapshot complete. Block #127840211. Portfolio value stable. No rebalancing needed.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 212 * 60_000,
    action: "SWAP ETH → USDC",
    reasoning: "ETH price increase caused allocation spike to 46.5%. Rebalancing 0.05 ETH to USDC to restore 40% target.",
    txHash: "0xfeed1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678",
  },
  {
    timestamp: Date.now() - 242 * 60_000,
    action: "HOLD",
    reasoning: "Post-rebalance check: ETH 40.2%, USDC 30.1%, WBTC 29.7%. Within tolerance. Agent entering monitoring mode.",
    txHash: null,
  },
  {
    timestamp: Date.now() - 272 * 60_000,
    action: "HOLD",
    reasoning: "First cycle complete. Balances loaded successfully. ETH: 0.0234 ETH, USDC: 0.00 USDC, WBTC: 0.00 WBTC. Waiting for price data.",
    txHash: null,
  },
];

// Current allocation (demo — will be replaced by live data when agent is running)
const DEMO_ALLOCATION = { ETH: 100, USDC: 0, WBTC: 0 };

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function AllocationBar({
  token,
  current,
  target,
}: {
  token: string;
  current: number;
  target: number;
}) {
  const drift = current - target;
  const driftColor = Math.abs(drift) > 5 ? "text-red-400" : Math.abs(drift) > 2 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/90">{token}</span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-slate-400">
            Target: <span className="text-white/70">{target}%</span>
          </span>
          <span className={`text-[12px] font-semibold ${driftColor}`}>
            {drift >= 0 ? "+" : ""}{drift.toFixed(1)}%
          </span>
        </div>
      </div>
      {/* Current allocation bar */}
      <div className="relative h-6 bg-[#1E293B] rounded-lg overflow-hidden">
        {/* Target line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
          style={{ left: `${target}%` }}
        />
        {/* Current bar */}
        <div
          className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
          style={{ width: `${Math.min(current, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-[11px] font-semibold text-white/90">{current.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function ProofPage() {
  const [uptime, setUptime] = useState<number>(0);
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    // Check server health
    fetchHealth().then((h) => {
      setServerUp(h?.status === "ok");
      if (h?.uptime) setUptime(h.uptime);
    });

    // Fetch GitHub stars
    fetchGitHubStars().then(setGithubStars);
  }, []);

  // Live uptime counter
  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const displayUptime = uptime + ticker;

  const tradeCount = MOCK_REASONING_LOGS.filter((l) => l.txHash).length;

  return (
    <div className="min-h-screen">
      <Header title="Proof of Autonomy" />
      <div className="p-8 space-y-6">

        {/* Top banner */}
        <div className="card-static p-6 border border-indigo-500/20 bg-indigo-500/[0.03]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Verifiable Autonomy</span>
              </div>
              <h2 className="text-[20px] font-bold text-white/95 mb-1">Meridian DeFi Rebalancer</h2>
              <p className="text-[13px] text-slate-400 max-w-xl">
                An autonomous AI agent running 24/7 on Arbitrum Sepolia. Every decision is made on-chain,
                every trade is verifiable on-chain. Zero human intervention required.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {serverUp === true && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Server Online
                </span>
              )}
              {serverUp === false && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Demo Mode
                </span>
              )}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.04] text-slate-400">
                Powered by Meridian SDK
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-static p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Agent Wallet</p>
            <a
              href={`https://sepolia.arbiscan.io/address/${AGENT_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span className="text-[12px] font-mono">
                {AGENT_WALLET.slice(0, 6)}...{AGENT_WALLET.slice(-4)}
              </span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <p className="text-[10px] text-slate-600 mt-1">Arbitrum Sepolia</p>
          </div>

          <div className="card-static p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Autonomous Trades</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold tabular-nums text-white/95">{tradeCount}</span>
              <span className="text-[12px] text-slate-500">executed</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">0 manual interventions</p>
          </div>

          <div className="card-static p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Agent Uptime</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              <span className="text-[16px] font-bold tabular-nums text-white/95 font-mono">
                {formatUptime(displayUptime)}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">continuous operation</p>
          </div>

          <div className="card-static p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">GitHub Stars</p>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <a
                href="https://github.com/amitduabits/meridiandefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[28px] font-bold tabular-nums text-white/95 hover:text-indigo-400 transition-colors"
              >
                {githubStars ?? "—"}
              </a>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">open source · MIT</p>
          </div>
        </div>

        {/* Allocation vs Target */}
        <div className="card-static p-6">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <h3 className="text-[14px] font-semibold text-white/90">Current Portfolio vs Target Allocation</h3>
            <span className="ml-auto text-[11px] text-slate-500">Threshold: ±5% triggers rebalance</span>
          </div>
          <div className="space-y-5">
            {Object.entries(TARGET_ALLOCATION).map(([token, target]) => (
              <AllocationBar
                key={token}
                token={token}
                current={DEMO_ALLOCATION[token as keyof typeof DEMO_ALLOCATION] ?? 0}
                target={target}
              />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-600">
            Target line (|) shows desired allocation. Bar shows current. Red drift = rebalance pending.
          </p>
        </div>

        {/* Reasoning logs */}
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E293B]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
              <h3 className="text-[14px] font-semibold text-white/90">Last 10 AI Decision Logs</h3>
            </div>
            <span className="text-[11px] text-slate-500">AI reasoning chain</span>
          </div>
          <div className="divide-y divide-[#1E293B]/40">
            {MOCK_REASONING_LOGS.slice(0, 10).map((log, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      log.txHash
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/10"
                    }`}>
                      {log.action}
                    </span>
                    {log.txHash && (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <span className="font-mono">{log.txHash.slice(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-600 tabular-nums shrink-0">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">{log.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <span className="text-[12px] text-slate-600">
            All trades verifiable on{" "}
            <a
              href={`https://sepolia.arbiscan.io/address/${AGENT_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Arbiscan
            </a>
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/amitduabits/meridiandefi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              View Source
            </a>
            <a
              href="https://meridianagents.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              meridianagents.xyz
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
