import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { MockPosition } from "../../lib/mock-data";

const COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function AllocationPie({ positions }: { positions: MockPosition[] }) {
  // Aggregate by token.
  const byToken = new Map<string, number>();
  for (const p of positions) {
    byToken.set(p.token, (byToken.get(p.token) ?? 0) + p.valueUsd);
  }

  const data = [...byToken.entries()]
    .map(([token, value]) => ({ name: token, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <defs>
            {COLORS.map((color, i) => (
              <linearGradient key={i} id={`pie-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#pie-grad-${i % COLORS.length})`} />
            ))}
          </Pie>
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
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-slate-400">
              {entry.name}
              <span className="text-slate-600 ml-1">
                {((entry.value / total) * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
