import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar businessName={business.business_name} ownerName={business.owner_name} />
      <main className="flex-1 overflow-x-hidden p-5 md:p-8">{children}</main>
    </div>
  );
}
