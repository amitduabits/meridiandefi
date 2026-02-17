import { Bell, Wallet, Search } from "lucide-react";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 glass border-b border-[#1E293B]/40 flex items-center justify-between px-8 sticky top-0 z-20">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-[17px] font-semibold tracking-tight text-white/95">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-200">
          <Search className="w-4 h-4" />
          <span className="text-xs hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-500 border border-white/[0.06]">/</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]">
            <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#1E293B] mx-1" />

        {/* Connect Wallet */}
        <button className="group flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[13px] font-medium text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-500/[0.06] hover:text-white transition-all duration-200">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-200">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.5} />
          </div>
          Connect
        </button>
      </div>
    </header>
  );
}
