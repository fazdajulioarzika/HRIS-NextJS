import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayrollPeriodList } from "@/components/payroll/payroll-period-list";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/dashboard");

  const { data: periods } = await supabase
    .from("payroll_periods")
    .select("id, name, month, year, status, created_at")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll</h1>
        <p className="text-muted-foreground">
          Kelola periode payroll dan generate gaji karyawan.
        </p>
      </div>

      <PayrollPeriodList periods={periods ?? []} />
    </div>
  );
}
