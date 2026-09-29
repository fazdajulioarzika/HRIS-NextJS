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
import { CorrectionApprovalList } from "@/components/attendance/correction-approval-list";

export const dynamic = "force-dynamic";

function getFullName(profiles: any): string {
  if (!profiles) return "-";
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "-";
  return profiles.full_name ?? "-";
}

export default async function CorrectionsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "manager" && profile?.role !== "hr")
    redirect("/attendance");

  const { data: corrections, error: correctionsError } = await supabase
    .from("attendance_corrections")
    .select(
      `id, date, requested_check_in, requested_check_out, reason, status, created_at,
     employees!attendance_corrections_employee_id_fkey ( manager_id, profiles ( full_name ) )`
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (corrections ?? []).map((c: any) => {
    const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
    return {
      id: c.id,
      date: c.date,
      requested_check_in: c.requested_check_in,
      requested_check_out: c.requested_check_out,
      reason: c.reason,
      full_name: getFullName(emp?.profiles),
      noManager: !emp?.manager_id,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href="/attendance">Attendance</Link>}
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Corrections</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Attendance Corrections</h1>
        <p className="text-muted-foreground">
          Pengajuan koreksi absensi yang menunggu persetujuan.
        </p>
      </div>

      <CorrectionApprovalList rows={rows} />
    </div>
  );
}
