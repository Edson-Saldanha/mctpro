"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ business_name: "", owner_name: "", phone: "", city: "", state: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return setError("Sessão expirada. Faça login novamente.");
    }
    const { error } = await supabase.from("businesses").insert({
      owner_id: userData.user.id,
      ...form,
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-1 font-display text-2xl font-bold text-white">Vamos configurar seu negócio</h1>
        <p className="mb-6 text-sm text-muted">Essas informações aparecem nos seus comprovantes e cobranças.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do negócio</Label>
            <Input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div>
            <Label>Nome do proprietário</Label>
            <Input required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input required maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Concluir e entrar no MCTPro"}
          </Button>
        </form>
      </div>
    </div>
  );
}
