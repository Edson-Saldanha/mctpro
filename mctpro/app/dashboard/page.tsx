import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import DashboardCharts from "@/components/dashboard/charts";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, addDays, startOfDay } from "date-fns";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
  const businessId = business!.id;

  const [{ data: sales }, { data: installments }, { data: clients }, { data: payments }] = await Promise.all([
    supabase.from("sales").select("*").eq("business_id", businessId),
    supabase.from("installments").select("*, clients(full_name)").eq("business_id", businessId),
    supabase.from("clients").select("id,status").eq("business_id", businessId),
    supabase.from("payments").select("*").eq("business_id", businessId),
  ]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = startOfDay(now);

  const salesThisMonth = (sales || []).filter((s) => isWithinInterval(new Date(s.sale_date), { start: monthStart, end: monthEnd }));
  const valorVendidoMes = salesThisMonth.reduce((acc, s) => acc + Number(s.total_amount), 0);

  const paymentsThisMonth = (payments || []).filter((p) => isWithinInterval(new Date(p.payment_date), { start: monthStart, end: monthEnd }));
  const valorRecebidoMes = paymentsThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

  const totalAReceber = (installments || []).filter((i) => i.status === "pendente" || i.status === "vencido")
    .reduce((acc, i) => acc + (Number(i.amount) - Number(i.paid_amount || 0)), 0);

  const parcelasVencidas = (installments || []).filter((i) => i.status === "vencido" || (i.status === "pendente" && new Date(i.due_date) < today));

  const clientesInadimplentes = (clients || []).filter((c) => c.status === "inadimplente").length;

  const lucroMes = valorRecebidoMes - 0; // custo será detalhado no módulo financeiro (fase 2)

  const cards = [
    { label: "Vendido no mês", value: formatCurrency(valorVendidoMes) },
    { label: "Recebido no mês", value: formatCurrency(valorRecebidoMes) },
    { label: "Total a receber", value: formatCurrency(totalAReceber) },
    { label: "Parcelas vencidas", value: parcelasVencidas.length },
    { label: "Clientes inadimplentes", value: clientesInadimplentes },
    { label: "Lucro do mês (recebido)", value: formatCurrency(lucroMes) },
    { label: "Total de clientes", value: (clients || []).length },
    { label: "Total de vendas", value: (sales || []).length },
  ];

  const vencendoHoje = (installments || []).filter(
    (i) => i.status === "pendente" && new Date(i.due_date).toDateString() === today.toDateString()
  );

  const semPagamento30d = (clients || []).length
    ? [] // calculado de forma simplificada — refinar na fase 2 com última data de pagamento por cliente
    : [];

  // séries para os gráficos (últimos 6 meses)
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
  const vendasPorMes = months.map((m) => {
    const start = startOfMonth(m), end = endOfMonth(m);
    const total = (sales || []).filter((s) => isWithinInterval(new Date(s.sale_date), { start, end }))
      .reduce((acc, s) => acc + Number(s.total_amount), 0);
    return { mes: m.toLocaleDateString("pt-BR", { month: "short" }), total };
  });
  const recebimentosPorMes = months.map((m) => {
    const start = startOfMonth(m), end = endOfMonth(m);
    const total = (payments || []).filter((p) => isWithinInterval(new Date(p.payment_date), { start, end }))
      .reduce((acc, p) => acc + Number(p.amount), 0);
    return { mes: m.toLocaleDateString("pt-BR", { month: "short" }), total };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral do seu negócio em tempo real</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1.5 font-display text-xl font-bold text-white">{c.value}</p>
          </Card>
        ))}
      </div>

      <DashboardCharts vendasPorMes={vendasPorMes} recebimentosPorMes={recebimentosPorMes} />

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-white">Alertas</h2>
        <div className="space-y-2">
          {vencendoHoje.length === 0 && parcelasVencidas.length === 0 ? (
            <p className="text-sm text-muted">Nenhum alerta por aqui. 🎉</p>
          ) : (
            <>
              {vencendoHoje.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2 text-sm">
                  <span className="text-white">{i.clients?.full_name} — parcela {i.installment_number} vence hoje</span>
                  <span className="font-medium text-warning">{formatCurrency(Number(i.amount))}</span>
                </div>
              ))}
              {parcelasVencidas.slice(0, 10).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg bg-danger/10 px-3 py-2 text-sm">
                  <span className="text-white">{i.clients?.full_name} — venceu em {formatDate(i.due_date)}</span>
                  <span className="font-medium text-danger">{formatCurrency(Number(i.amount))}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
