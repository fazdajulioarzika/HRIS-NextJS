import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayslipList } from "@/components/payroll/payslip-list";

export const dynamic = "force-dynamic";

function getName(rel: any, path: string[]): string {
  let cur = Array.isArray(rel) ? rel[0] : rel;
  for (const key of path) {
    if (!cur) return "-";
    cur = Array.isArray(cur[key]) ? cur[key][0] : cur[key];
  }
  return cur ?? "-";
}

export default async function PayslipPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.user.id)
    .single();

  if (!employee) {
    return (
      <div className="text-muted-foreground">
        Data karyawan Anda belum lengkap. Hubungi HR.
      </div>
    );
  }

  const { data: payrolls } = await supabase
    .from("payrolls")
    .select(
      `id, net_salary,
       payroll_periods ( id, name, month, year, status )`
    )
    .eq("employee_id", employee.id);

  const rows = (payrolls ?? [])
    .map((p: any) => ({
      id: p.id,
      net_salary: p.net_salary,
      period_name: getName(p.payroll_periods, ["name"]),
      status: getName(p.payroll_periods, ["status"]),
      month: Array.isArray(p.payroll_periods)
        ? p.payroll_periods[0]?.month
        : p.payroll_periods?.month,
      year: Array.isArray(p.payroll_periods)
        ? p.payroll_periods[0]?.year
        : p.payroll_periods?.year,
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Slip Gaji</h1>
        <p className="text-muted-foreground">Riwayat slip gaji Anda.</p>
      </div>

      <PayslipList rows={rows} />
    </div>
  );
}
