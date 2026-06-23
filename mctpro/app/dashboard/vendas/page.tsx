"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Badge } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VendasPage() {
  const supabase = createClient();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: business } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
      const { data } = await supabase
        .from("sales")
        .select("*, clients(full_name)")
        .eq("business_id", business!.id)
        .order("sale_date", { ascending: false });
      setSales(data || []);
      setLoading(false);
    })();
  }, []);

  const statusTone: Record<string, "success" | "warning" | "danger"> = {
    quitada: "success", aberta: "warning", parcialmente_paga: "warning", cancelada: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Vendas</h1>
          <p className="text-sm text-muted">{sales.length} vendas registradas</p>
        </div>
        <Link href="/dashboard/vendas/nova"><Button><Plus size={16} /> Nova venda</Button></Link>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3">Data</th><th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Valor total</th><th className="px-4 py-3">Parcelamento</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Carregando...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhuma venda ainda.</td></tr>
            ) : sales.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3">{formatDate(s.sale_date)}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/vendas/${s.id}`} className="font-medium text-white hover:text-primary">{s.clients?.full_name}</Link>
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(s.total_amount))}</td>
                <td className="px-4 py-3 capitalize text-muted">{s.installment_type} · {s.installment_count}x</td>
                <td className="px-4 py-3"><Badge tone={statusTone[s.status]}>{s.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
