import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function VendaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: sale } = await supabase.from("sales").select("*, clients(full_name, phone)").eq("id", params.id).maybeSingle();
  if (!sale) notFound();

  const { data: items } = await supabase.from("sale_items").select("*, products(name)").eq("sale_id", params.id);
  const { data: installments } = await supabase.from("installments").select("*").eq("sale_id", params.id).order("installment_number");

  const statusTone: Record<string, "success" | "warning" | "danger"> = {
    quitada: "success", aberta: "warning", parcialmente_paga: "warning", cancelada: "danger",
    pago: "success", pendente: "warning", vencido: "danger", renegociado: "warning",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Venda de {formatDate(sale.sale_date)}</h1>
          <p className="text-sm text-muted">{sale.clients?.full_name} · {sale.clients?.phone}</p>
        </div>
        <Badge tone={statusTone[sale.status]}>{sale.status}</Badge>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border p-4"><h2 className="font-display text-base font-semibold text-white">Itens</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Produto</th><th className="px-4 py-3">Qtd</th><th className="px-4 py-3">Unitário</th><th className="px-4 py-3">Total</th>
          </tr></thead>
          <tbody>
            {(items || []).map((it: any) => (
              <tr key={it.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-white">{it.products?.name}</td>
                <td className="px-4 py-3 text-muted">{it.quantity}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(Number(it.unit_price))}</td>
                <td className="px-4 py-3 text-white">{formatCurrency(Number(it.total_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><p className="text-xs text-muted">Total da venda</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(Number(sale.total_amount))}</p></Card>
        <Card><p className="text-xs text-muted">Entrada</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(Number(sale.down_payment))}</p></Card>
        <Card><p className="text-xs text-muted">Desconto</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(Number(sale.discount))}</p></Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border p-4"><h2 className="font-display text-base font-semibold text-white">Parcelas (gerencie em "Parcelas" no menu)</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Nº</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {(installments || []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Venda à vista, sem parcelas.</td></tr>
            ) : (installments || []).map((i) => (
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
