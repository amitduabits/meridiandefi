import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MockPnlPoint } from "../../lib/mock-data";

export function EquityCurve({ data }: { data: MockPnlPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
          axisLine={{ stroke: "rgba(148,163,184,0.06)" }}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          dx={-4}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(19, 20, 28, 0.95)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            borderRadius: "12px",
            color: "#F1F5F9",
            fontSize: 12,
            fontWeight: 500,
            padding: "10px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
          cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#strokeGradient)"
          strokeWidth={2.5}
          fill="url(#colorValue)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#6366F1",
            stroke: "#0A0B10",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
