import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SalaryComponentTable } from "@/components/payroll/salary-component-table";

export const dynamic = "force-dynamic";

export default async function SalaryComponentsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/payroll");

  const { data: components } = await supabase
    .from("salary_components")
    .select("id, name, type, calculation_type, default_amount, is_active")
    .order("type")
    .order("name");

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/payroll">Payroll</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Salary Components</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Salary Components</h1>
        <p className="text-muted-foreground">
          Kelola komponen tunjangan dan potongan yang dipakai saat generate
          payroll.
        </p>
      </div>

      <SalaryComponentTable components={components ?? []} />
    </div>
  );
}
