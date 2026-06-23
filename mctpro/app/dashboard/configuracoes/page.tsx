"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
      setForm(data);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("businesses").update({
      business_name: form.business_name,
      owner_name: form.owner_name,
      phone: form.phone,
      whatsapp: form.whatsapp,
      address: form.address,
      city: form.city,
      state: form.state,
      default_credit_limit: form.default_credit_limit,
      fee_rate: form.fee_rate,
    }).eq("id", form.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!form) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-muted">Dados do seu negócio</p>
      </div>
      <Card>
        <form onSubmit={handleSave} className="space-y-3">
          <div><Label>Nome da empresa</Label><Input value={form.business_name || ""} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><Label>Nome do proprietário</Label><Input value={form.owner_name || ""} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          </div>
          <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Estado</Label><Input maxLength={2} value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Limite padrão de crédito (R$)</Label><Input type="number" step="0.01" value={form.default_credit_limit || 0} onChange={(e) => setForm({ ...form, default_credit_limit: Number(e.target.value) })} /></div>
            <div><Label>Taxa padrão (%)</Label><Input type="number" step="0.01" value={form.fee_rate || 0} onChange={(e) => setForm({ ...form, fee_rate: Number(e.target.value) })} /></div>
          </div>
          {saved && <p className="text-sm text-success">Configurações salvas.</p>}
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar configurações"}</Button>
        </form>
      </Card>
    </div>
  );
}
