"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Receipt,
  Wallet, Settings, LogOut,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/dashboard/parcelas", label: "Parcelas", icon: Receipt },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ businessName, ownerName }: { businessName: string; ownerName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
      <div className="mb-6 px-2 pt-2">
        <h1 className="font-display text-xl font-bold text-white">
          MCT<span className="text-primary">Pro</span>
        </h1>
        <p className="mt-1 truncate text-xs text-muted">{businessName}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface2 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border pt-3">
        <p className="px-3 text-xs text-muted truncate">{ownerName}</p>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface2 hover:text-white"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
}
