"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card, Modal } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const categories = ["Compra de mercadorias", "Combustível", "Alimentação", "Transporte", "Impostos", "Outros"];
const emptyForm = { category: categories[0], description: "", amount: 0, expense_date: new Date().toISOString().slice(0,10) };

export default function FinanceiroPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [receitas, setReceitas] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [businessId, setBusinessId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    setBusinessId(business!.id);
    const { data: exp } = await supabase.from("expenses").select("*").eq("business_id", business!.id).order("expense_date", { ascending: false });
    const { data: pay } = await supabase.from("payments").select("amount").eq("business_id", business!.id);
    setExpenses(exp || []);
    setReceitas((pay || []).reduce((acc, p) => acc + Number(p.amount), 0));
  }
  useEffect(() => { load(); }, []);

  const totalDespesas = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const lucroLiquido = receitas - totalDespesas;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("expenses").insert({ ...form, business_id: businessId });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-sm text-muted">Fluxo de caixa do seu negócio</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Nova despesa</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><p className="text-xs text-muted">Receita (recebimentos)</p><p className="mt-1 font-display text-lg font-bold text-success">{formatCurrency(receitas)}</p></Card>
        <Card><p className="text-xs text-muted">Despesas</p><p className="mt-1 font-display text-lg font-bold text-danger">{formatCurrency(totalDespesas)}</p></Card>
        <Card><p className="text-xs text-muted">Lucro líquido</p><p className="mt-1 font-display text-lg font-bold text-white">{formatCurrency(lucroLiquido)}</p></Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border p-4"><h2 className="font-display text-base font-semibold text-white">Despesas</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Data</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Valor</th>
          </tr></thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Nenhuma despesa lançada.</td></tr>
            ) : expenses.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(e.expense_date)}</td>
                <td className="px-4 py-3 text-white">{e.category}</td>
                <td className="px-4 py-3 text-muted">{e.description || "—"}</td>
                <td className="px-4 py-3 text-danger">{formatCurrency(Number(e.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova despesa">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <Label>Categoria</Label>
            <select className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar despesa"}</Button>
        </form>
      </Modal>
    </div>
  );
}
