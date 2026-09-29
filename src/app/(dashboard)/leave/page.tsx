import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveRequestDialog } from "@/components/leave/leave-request-dialog";
import { LeaveHistory } from "@/components/leave/leave-history";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  manager_approved: "Manager Approved",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default async function LeavePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

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

  const currentYear = new Date().getFullYear();

  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("id, name")
    .order("name");

  const { data: balances } = await supabase
    .from("leave_balances")
    .select("total_days, used_days, leave_types ( name )")
    .eq("employee_id", employee.id)
    .eq("year", currentYear);

  const { data: history } = await supabase
    .from("leave_requests")
    .select(
      "id, start_date, end_date, total_days, reason, status, rejection_reason, leave_types ( name )"
    )
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  function getTypeName(lt: any) {
    if (!lt) return "-";
    return Array.isArray(lt) ? lt[0]?.name ?? "-" : lt.name ?? "-";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave</h1>
          <p className="text-muted-foreground">
            Ajukan cuti dan lihat riwayat pengajuan Anda.
          </p>
        </div>

        <div className="flex gap-2">
          {(profile?.role === "manager" || profile?.role === "hr") && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href="/leave/approvals"
                  className="flex items-center gap-2"
                >
                  <ClipboardCheck className="size-4" />
                  Approvals
                </Link>
              }
            />
          )}
          <LeaveRequestDialog leaveTypes={leaveTypes ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(balances ?? []).map((b: any, i: number) => {
          const remaining = b.total_days - b.used_days;
          return (
            <Card key={i}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">
                  {getTypeName(b.leave_types)}
                </p>
                <p className="text-2xl font-bold">{remaining}</p>
                <p className="text-xs text-muted-foreground">
                  dari {b.total_days} hari
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LeaveHistory
        records={(history ?? []).map((h: any) => ({
          ...h,
          type_name: getTypeName(h.leave_types),
        }))}
        statusLabel={statusLabel}
      />
    </div>
  );
}
