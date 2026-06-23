"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card, Badge, Modal } from "@/components/ui";
import { Plus, Search } from "lucide-react";

const emptyForm = {
  full_name: "", cpf: "", phone: "", whatsapp: "", email: "",
  address: "", number: "", neighborhood: "", city: "", state: "",
  zip_code: "", reference: "", credit_limit: 0,
};

export default function ClientesPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    const { data } = await supabase.from("clients").select("*").eq("business_id", business!.id).order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
    await supabase.from("clients").insert({ ...form, business_id: business!.id });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  );

  const statusTone: Record<string, "success" | "warning" | "danger"> = {
    ativo: "success", bloqueado: "warning", inadimplente: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-muted">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Novo cliente</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-3 text-muted" />
        <Input placeholder="Buscar por nome ou telefone" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Limite</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhum cliente encontrado.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface2/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/clientes/${c.id}`} className="font-medium text-white hover:text-primary">{c.full_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.city || "—"}</td>
                  <td className="px-4 py-3 text-muted">R$ {Number(c.credit_limit).toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente">
        <form onSubmit={handleSave} className="space-y-3">
          <div><Label>Nome completo</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
            <div><Label>Telefone / WhatsApp</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: e.target.value })} /></div>
          </div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Número</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Estado</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
          </div>
          <div><Label>Ponto de referência</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
          <div><Label>Limite de crédito (R$)</Label><Input type="number" step="0.01" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} /></div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar cliente"}</Button>
        </form>
      </Modal>
    </div>
  );
}
