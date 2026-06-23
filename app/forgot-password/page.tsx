"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 font-display text-xl font-bold text-white">Recuperar senha</h1>
        {sent ? (
          <p className="text-sm text-success">Enviamos um link de recuperação para seu e-mail.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>E-mail cadastrado</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
