"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card, Badge, Modal } from "@/components/ui";
import { Plus, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const emptyForm = { name: "", category: "", sku: "", internal_code: "", description: "", cost: 0, sale_price: 0, stock_current: 0, stock_min: 0 };

export default function ProdutosPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    const { data } = await supabase.from("products").select("*").eq("business_id", business!.id).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    await supabase.from("products").insert({ ...form, business_id: business!.id });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Produtos</h1>
          <p className="text-sm text-muted">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Novo produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-3 text-muted" />
        <Input placeholder="Buscar produto" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Produto</th><th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Custo</th><th className="px-4 py-3">Venda</th><th className="px-4 py-3">Estoque</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhum produto encontrado.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.category || "—"}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(Number(p.cost))}</td>
                <td className="px-4 py-3 text-white">{formatCurrency(Number(p.sale_price))}</td>
                <td className="px-4 py-3">
                  <Badge tone={Number(p.stock_current) <= Number(p.stock_min) ? "danger" : "success"}>
                    {p.stock_current} un.
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo produto">
        <form onSubmit={handleSave} className="space-y-3">
          <div><Label>Nome do produto</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>SKU / Código</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          </div>
          <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
            <div><Label>Preço de venda (R$)</Label><Input type="number" step="0.01" required value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Estoque atual</Label><Input type="number" value={form.stock_current} onChange={(e) => setForm({ ...form, stock_current: Number(e.target.value) })} /></div>
            <div><Label>Estoque mínimo</Label><Input type="number" value={form.stock_min} onChange={(e) => setForm({ ...form, stock_min: Number(e.target.value) })} /></div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar produto"}</Button>
        </form>
      </Modal>
    </div>
  );
}
