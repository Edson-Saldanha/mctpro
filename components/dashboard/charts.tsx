"use client";
import { Card } from "@/components/ui";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DashboardCharts({
  vendasPorMes,
  recebimentosPorMes,
}: {
  vendasPorMes: { mes: string; total: number }[];
  recebimentosPorMes: { mes: string; total: number }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-white">Vendas por mês</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={vendasPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="mes" stroke="#8A8A92" fontSize={12} />
            <YAxis stroke="#8A8A92" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1C1C1F", border: "1px solid #27272A", borderRadius: 8 }} />
            <Bar dataKey="total" fill="#EE4D2D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-white">Recebimentos por mês</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={recebimentosPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="mes" stroke="#8A8A92" fontSize={12} />
            <YAxis stroke="#8A8A92" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1C1C1F", border: "1px solid #27272A", borderRadius: 8 }} />
            <Bar dataKey="total" fill="#22C55E" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
