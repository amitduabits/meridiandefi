import { NavLink } from "react-router-dom";
import {
  Bot,
  Wallet,
  ArrowLeftRight,
  Shield,
  Activity,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Bot, label: "Agents" },
  { to: "/portfolio", icon: Wallet, label: "Portfolio" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/risk", icon: Shield, label: "Risk" },
  { to: "/health", icon: Activity, label: "System" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#0A0B10] flex flex-col z-30 border-r border-[#1E293B]/60">
      {/* ── Logo ────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 h-16 shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold tracking-tight text-white/95">Meridian</span>
          <span className="text-[10px] font-medium text-indigo-400/60 tracking-widest uppercase">Agent Framework</span>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent" />

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-white bg-white/[0.06]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`
            }
            end={item.to === "/"}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500 animate-slide-in-left" />
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.04]"
                }`}>
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.5)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent" />

      {/* ── Footer ──────────────────────────────────── */}
      <div className="px-5 py-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
        <span className="text-[11px] font-medium text-slate-500">v0.1.0</span>
        <span className="text-[11px] text-slate-600 ml-auto">Operational</span>
      </div>
    </aside>
  );
}
