import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OvertimeRequestDialog } from "@/components/overtime/overtime-request-dialog";
import { OvertimeHistory } from "@/components/overtime/overtime-history";

export const dynamic = "force-dynamic";

export default async function OvertimePage() {
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

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: history } = await supabase
    .from("overtime_requests")
    .select(
      "id, date, start_time, end_time, total_hours, reason, status, rejection_reason"
    )
    .eq("employee_id", employee.id)
    .order("date", { ascending: false });

  const thisMonthApproved = (history ?? []).filter(
    (h) => h.status === "approved" && h.date.startsWith(currentMonth)
  );
  const totalHoursThisMonth = thisMonthApproved.reduce(
    (sum, h) => sum + Number(h.total_hours),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overtime</h1>
          <p className="text-muted-foreground">
            Ajukan lembur dan lihat riwayat pengajuan Anda.
          </p>
        </div>

        <div className="flex gap-2">
          {(profile?.role === "manager" || profile?.role === "hr") && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href="/overtime/approvals"
                  className="flex items-center gap-2"
                >
                  <ClipboardCheck className="size-4" />
                  Approvals
                </Link>
              }
            />
          )}
          <OvertimeRequestDialog />
        </div>
      </div>

      <Card className="w-fit">
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Approved Hours This Month
          </p>
          <p className="text-2xl font-bold">
            {totalHoursThisMonth.toFixed(1)}h
          </p>
        </CardContent>
      </Card>

      <OvertimeHistory records={history ?? []} />
    </div>
  );
}
