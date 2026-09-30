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
import { OvertimeApprovalTabs } from "@/components/overtime/overtime-approval-tabs";

export const dynamic = "force-dynamic";

function getName(rel: any, path: string[]): string {
  let cur = Array.isArray(rel) ? rel[0] : rel;
  for (const key of path) {
    if (!cur) return "-";
    cur = Array.isArray(cur[key]) ? cur[key][0] : cur[key];
  }
  return cur ?? "-";
}

export default async function OvertimeApprovalsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "manager" && profile?.role !== "hr")
    redirect("/overtime");

  const pendingFilter =
    profile.role === "hr" ? ["pending", "manager_approved"] : ["pending"];

  const baseSelect = `id, date, start_time, end_time, total_hours, reason, status, rejection_reason,
     employees!overtime_requests_employee_id_fkey ( profiles ( full_name ) )`;

  const [{ data: pendingRequests }, { data: historyRequests }] =
    await Promise.all([
      supabase
        .from("overtime_requests")
        .select(baseSelect)
        .in("status", pendingFilter)
        .order("created_at", { ascending: true }),
      supabase
        .from("overtime_requests")
        .select(baseSelect)
        .in("status", ["approved", "rejected", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  function mapRows(data: any[] | null) {
    return (data ?? []).map((r: any) => ({
      id: r.id,
      full_name: getName(r.employees, ["profiles", "full_name"]),
      date: r.date,
      start_time: r.start_time,
      end_time: r.end_time,
      total_hours: r.total_hours,
      reason: r.reason,
      status: r.status,
      rejection_reason: r.rejection_reason,
    }));
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/overtime">Overtime</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Approvals</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Overtime Approvals</h1>
        <p className="text-muted-foreground">
          {profile.role === "hr"
            ? "Final approval untuk semua pengajuan."
            : "Review pengajuan lembur tim Anda."}
        </p>
      </div>

      <OvertimeApprovalTabs
        pendingRows={mapRows(pendingRequests)}
        historyRows={mapRows(historyRequests)}
        role={profile.role}
      />
    </div>
  );
}
