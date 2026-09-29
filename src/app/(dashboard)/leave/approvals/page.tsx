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
import { LeaveApprovalList } from "@/components/leave/leave-approval-list";

export const dynamic = "force-dynamic";

function getName(rel: any, path: string[]): string {
  let cur = Array.isArray(rel) ? rel[0] : rel;
  for (const key of path) {
    if (!cur) return "-";
    cur = Array.isArray(cur[key]) ? cur[key][0] : cur[key];
  }
  return cur ?? "-";
}

export default async function LeaveApprovalsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "manager" && profile?.role !== "hr") redirect("/leave");

  const statusFilter =
    profile.role === "hr" ? ["pending", "manager_approved"] : ["pending"];

  const { data: requests } = await supabase
    .from("leave_requests")
    .select(
      `id, start_date, end_date, total_days, reason, status,
       employees!leave_requests_employee_id_fkey ( profiles ( full_name ) ),
       leave_types ( name )`
    )
    .in("status", statusFilter)
    .order("created_at", { ascending: true });

  const rows = (requests ?? []).map((r: any) => ({
    id: r.id,
    full_name: getName(r.employees, ["profiles", "full_name"]),
    type_name: getName(r.leave_types, ["name"]),
    start_date: r.start_date,
    end_date: r.end_date,
    total_days: r.total_days,
    reason: r.reason,
    status: r.status,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/leave">Leave</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Approvals</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Leave Approvals</h1>
        <p className="text-muted-foreground">
          {profile.role === "hr"
            ? "Final approval untuk semua pengajuan."
            : "Review pengajuan cuti tim Anda."}
        </p>
      </div>

      <LeaveApprovalList rows={rows} role={profile.role} />
    </div>
  );
}
