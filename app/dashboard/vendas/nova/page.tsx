"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { generateInstallments, InstallmentType } from "@/lib/installments";

interface SaleItem { product_id: string; name: string; quantity: number; unit_price: number; }

export default function NovaVendaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentType, setInstallmentType] = useState<InstallmentType>("mensal");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
      setBusinessId(business!.id);
      const { data: c } = await supabase.from("clients").select("id,full_name").eq("business_id", business!.id);
      const { data: p } = await supabase.from("products").select("id,name,sale_price,stock_current").eq("business_id", business!.id);
      setClients(c || []);
      setProducts(p || []);
    })();
  }, []);

  function addItem(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: Number(product.sale_price) }]);
  }

  function updateItem(index: number, patch: Partial<SaleItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const financedAmount = Math.max(0, totalAmount - downPayment);

  const preview = generateInstallments(financedAmount, installmentType, installmentType === "vista" ? 1 : installmentCount);

  async function handleSubmit() {
    if (!clientId || items.length === 0) return alert("Selecione um cliente e ao menos um produto.");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        business_id: businessId,
        client_id: clientId,
        sale_date: new Date().toISOString(),
        total_amount: totalAmount,
        discount,
        down_payment: downPayment,
        installment_type: installmentType,
        installment_count: installmentType === "vista" ? 1 : installmentCount,
        status: financedAmount <= 0 ? "quitada" : "aberta",
      })
      .select()
      .single();

    if (saleError || !sale) {
      setSaving(false);
      return alert("Erro ao salvar venda: " + saleError?.message);
    }

    await supabase.from("sale_items").insert(
      items.map((it) => ({
        sale_id: sale.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.quantity * it.unit_price,
      }))
    );

    // baixa de estoque
    for (const it of items) {
      const product = products.find((p) => p.id === it.product_id);
      if (product) {
        await supabase.from("products").update({ stock_current: Number(product.stock_current) - it.quantity }).eq("id", it.product_id);
      }
    }

    if (financedAmount > 0) {
      const generated = generateInstallments(financedAmount, installmentType, installmentType === "vista" ? 1 : installmentCount);
      await supabase.from("installments").insert(
        generated.map((g) => ({
          business_id: businessId,
          sale_id: sale.id,
          client_id: clientId,
          installment_number: g.installment_number,
          due_date: g.due_date,
          amount: g.amount,
        }))
      );
    }

    setSaving(false);
    router.push(`/dashboard/vendas/${sale.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Nova venda</h1>
        <p className="text-sm text-muted">Selecione o cliente, os produtos e o parcelamento</p>
      </div>

      <Card>
        <Label>Cliente</Label>
        <select
          className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Produtos</Label>
        </div>
        <select
          className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary"
          onChange={(e) => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }}
        >
          <option value="">+ Adicionar produto</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.sale_price))}</option>)}
        </select>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2">
              <span className="flex-1 text-sm text-white">{it.name}</span>
              <Input type="number" min={1} className="w-16" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
              <Input type="number" step="0.01" className="w-28" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} />
              <span className="w-24 text-right text-sm text-muted">{formatCurrency(it.quantity * it.unit_price)}</span>
              <button onClick={() => removeItem(i)} className="text-danger"><Trash2 size={16} /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">Nenhum produto adicionado ainda.</p>}
        </div>
      </Card>

      <Card className="grid grid-cols-2 gap-4">
        <div><Label>Desconto (R$)</Label><Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        <div><Label>Entrada (R$)</Label><Input type="number" step="0.01" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} /></div>
        <div>
          <Label>Parcelamento</Label>
          <select
            className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary"
            value={installmentType}
            onChange={(e) => setInstallmentType(e.target.value as InstallmentType)}
          >
            <option value="vista">À vista</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
          </select>
        </div>
        {installmentType !== "vista" && (
          <div><Label>Quantidade de parcelas</Label><Input type="number" min={1} value={installmentCount} onChange={(e) => setInstallmentCount(Number(e.target.value))} /></div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div>
        <div className="mb-3 flex justify-between text-sm"><span className="text-muted">Total com desconto</span><span className="text-white">{formatCurrency(totalAmount)}</span></div>
        <div className="mb-4 flex justify-between text-sm"><span className="text-muted">A financiar (após entrada)</span><span className="font-semibold text-primary">{formatCurrency(financedAmount)}</span></div>

        {financedAmount > 0 && (
          <div className="space-y-1.5 rounded-lg bg-surface2 p-3">
            <p className="mb-2 text-xs text-muted">Cronograma de parcelas</p>
            {preview.map((p) => (
              <div key={p.installment_number} className="flex justify-between text-xs text-muted">
                <span>Parcela {p.installment_number} — {p.due_date}</span>
                <span className="text-white">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Button onClick={handleSubmit} disabled={saving} className="w-full">
        {saving ? "Salvando venda..." : "Finalizar venda"}
      </Button>
    </div>
  );
}
