"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Badge, Modal, Input, Label } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

type Filter = "todas" | "hoje" | "semana" | "mes" | "vencidas" | "recebidas";

export default function ParcelasPage() {
  const supabase = createClient();
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todas");
  const [businessId, setBusinessId] = useState("");
  const [payModal, setPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("pix");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    setBusinessId(business!.id);
    const { data } = await supabase
      .from("installments")
      .select("*, clients(full_name, phone)")
      .eq("business_id", business!.id)
      .order("due_date");
    setInstallments(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const filtered = installments.filter((i) => {
    const due = new Date(i.due_date);
    if (filter === "hoje") return due.toDateString() === today.toDateString();
    if (filter === "semana") return due >= today && due <= weekEnd;
    if (filter === "mes") return due <= monthEnd && due >= today;
    if (filter === "vencidas") return i.status === "vencido" || (i.status === "pendente" && due < today);
    if (filter === "recebidas") return i.status === "pago";
    return true;
  });

  function openPayModal(installment: any) {
    setPayModal(installment);
    setPayAmount(Number(installment.amount) - Number(installment.paid_amount || 0));
  }

  async function registrarPagamento() {
    if (!payModal) return;
    setSaving(true);
    const novoPago = Number(payModal.paid_amount || 0) + payAmount;
    const status = novoPago >= Number(payModal.amount) ? "pago" : "pendente";

    await supabase.from("payments").insert({
      business_id: businessId,
      installment_id: payModal.id,
      sale_id: payModal.sale_id,
      client_id: payModal.client_id,
      amount: payAmount,
      method: payMethod,
    });

    await supabase.from("installments").update({
      paid_amount: novoPago,
      status,
      paid_at: status === "pago" ? new Date().toISOString() : null,
    }).eq("id", payModal.id);

    // atualiza status da venda se todas as parcelas estiverem pagas
    const { data: saleInstallments } = await supabase.from("installments").select("id, status").eq("sale_id", payModal.sale_id);
    const allPaid = (saleInstallments || []).every((i) =>
      i.id === payModal.id ? status === "pago" : i.status === "pago"
    );
    if (allPaid) {
      await supabase.from("sales").update({ status: "quitada" }).eq("id", payModal.sale_id);
    } else {
      await supabase.from("sales").update({ status: "parcialmente_paga" }).eq("id", payModal.sale_id);
    }

    setSaving(false);
    setPayModal(null);
    load();
  }

  const statusTone: Record<string, "success" | "warning" | "danger"> = {
    pago: "success", pendente: "warning", vencido: "danger", renegociado: "warning",
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "todas", label: "Todas" }, { key: "hoje", label: "Hoje" }, { key: "semana", label: "Esta semana" },
    { key: "mes", label: "Este mês" }, { key: "vencidas", label: "Vencidas" }, { key: "recebidas", label: "Recebidas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Parcelas</h1>
        <p className="text-sm text-muted">Acompanhe vencimentos e registre pagamentos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? "bg-primary text-white" : "bg-surface2 text-muted hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Parcela</th>
            <th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Nenhuma parcela encontrada.</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3 text-white">{i.clients?.full_name}</td>
                <td className="px-4 py-3 text-muted">{i.installment_number}</td>
                <td className="px-4 py-3 text-muted">{formatDate(i.due_date)}</td>
                <td className="px-4 py-3 text-white">{formatCurrency(Number(i.amount))}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[i.status]}>{i.status}</Badge></td>
                <td className="px-4 py-3">
                  {i.status !== "pago" && (
                    <Button variant="ghost" onClick={() => openPayModal(i)} className="!px-2.5 !py-1.5 text-xs">Registrar pagamento</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Registrar pagamento">
        {payModal && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{payModal.clients?.full_name} — parcela {payModal.installment_number}</p>
            <div><Label>Valor recebido (R$)</Label><Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} /></div>
            <div>
              <Label>Forma de pagamento</Label>
              <select className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <Button onClick={registrarPagamento} disabled={saving} className="w-full">{saving ? "Salvando..." : "Confirmar recebimento"}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
