import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PayrollPeriodDetail } from "@/components/payroll/payroll-period-detail";

export const dynamic = "force-dynamic";

function getFullName(profiles: any): string {
  if (!profiles) return "-";
  return Array.isArray(profiles)
    ? profiles[0]?.full_name ?? "-"
    : profiles.full_name ?? "-";
}

export default async function PayrollPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/dashboard");

  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, name, month, year, status")
    .eq("id", id)
    .single();

  if (!period) notFound();

  const { data: payrolls } = await supabase
    .from("payrolls")
    .select(
      `id, basic_salary, total_allowance, total_overtime, gross_salary, total_deduction, net_salary,
       employees ( profiles ( full_name ) )`
    )
    .eq("payroll_period_id", id)
    .order("net_salary", { ascending: false });

  const rows = (payrolls ?? []).map((p: any) => ({
    id: p.id,
    full_name: getFullName(
      Array.isArray(p.employees)
        ? p.employees[0]?.profiles
        : p.employees?.profiles
    ),
    basic_salary: p.basic_salary,
    total_allowance: p.total_allowance,
    total_overtime: p.total_overtime,
    gross_salary: p.gross_salary,
    total_deduction: p.total_deduction,
    net_salary: p.net_salary,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/payroll">Payroll</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{period.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PayrollPeriodDetail period={period} rows={rows} />
    </div>
  );
}
