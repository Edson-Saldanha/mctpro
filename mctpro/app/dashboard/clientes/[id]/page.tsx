import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.id).maybeSingle();
  if (!client) notFound();

  const { data: sales } = await supabase.from("sales").select("*").eq("client_id", params.id).order("sale_date", { ascending: false });
  const { data: installments } = await supabase.from("installments").select("*").eq("client_id", params.id);

  const totalComprado = (sales || []).reduce((acc, s) => acc + Number(s.total_amount), 0);
  const totalPago = (installments || []).reduce((acc, i) => acc + Number(i.paid_amount || 0), 0);
  const totalEmAtraso = (installments || []).filter((i) => i.status === "vencido")
    .reduce((acc, i) => acc + (Number(i.amount) - Number(i.paid_amount || 0)), 0);

  const statusTone: Record<string, "success" | "warning" | "danger"> = {
    ativo: "success", bloqueado: "warning", inadimplente: "danger",
    pago: "success", pendente: "warning", vencido: "danger", renegociado: "warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{client.full_name}</h1>
          <p className="text-sm text-muted">{client.phone} · {client.city}/{client.state}</p>
        </div>
        <Badge tone={statusTone[client.status]}>{client.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><p className="text-xs text-muted">Total comprado</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(totalComprado)}</p></Card>
        <Card><p className="text-xs text-muted">Total pago</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(totalPago)}</p></Card>
        <Card><p className="text-xs text-muted">Em atraso</p><p className="mt-1 font-display text-lg font-bold text-danger">{formatCurrency(totalEmAtraso)}</p></Card>
        <Card><p className="text-xs text-muted">Limite de crédito</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(Number(client.credit_limit))}</p></Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border p-4"><h2 className="font-display text-base font-semibold text-white">Vendas</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Data</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Parcelamento</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {(sales || []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Nenhuma venda registrada.</td></tr>
            ) : (sales || []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{formatDate(s.sale_date)}</td>
                <td className="px-4 py-3">{formatCurrency(Number(s.total_amount))}</td>
                <td className="px-4 py-3 capitalize text-muted">{s.installment_type} · {s.installment_count}x</td>
                <td className="px-4 py-3"><Badge tone={s.status === "quitada" ? "success" : s.status === "cancelada" ? "danger" : "warning"}>{s.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border p-4"><h2 className="font-display text-base font-semibold text-white">Parcelas</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Nº</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {(installments || []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Nenhuma parcela.</td></tr>
            ) : (installments || []).sort((a,b)=>a.due_date.localeCompare(b.due_date)).map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{i.installment_number}</td>
                <td className="px-4 py-3">{formatDate(i.due_date)}</td>
                <td className="px-4 py-3">{formatCurrency(Number(i.amount))}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[i.status]}>{i.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
