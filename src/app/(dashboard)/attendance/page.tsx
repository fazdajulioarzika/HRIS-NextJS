import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Users, FileEdit } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CheckInWidget } from "@/components/attendance/check-in-widget";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { CorrectionDialog } from "@/components/attendance/correction-dialog";
import {
  getCurrentMonthString,
  getMonthRange,
} from "@/lib/utils/attendance-date";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const selectedMonth = month ?? getCurrentMonthString();
  const { start, end } = getMonthRange(selectedMonth);

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

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("check_in, check_out, status, late_minutes")
    .eq("employee_id", employee.id)
    .eq("date", today)
    .single();

  const { data: history } = await supabase
    .from("attendance")
    .select("id, date, check_in, check_out, status, late_minutes, work_minutes")
    .eq("employee_id", employee.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
  const totalPresent = (history ?? []).filter((h) => h.status).length;
  const totalLate = (history ?? []).filter((h) => h.status === "late").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Check-in dan riwayat kehadiran Anda.
          </p>
        </div>

        <div className="flex gap-2">
          {profile?.role === "manager" && (
            <Button
              variant="default"
              nativeButton={false}
              render={
                <Link
                  href="/attendance/team"
                  className="flex items-center gap-2"
                >
                  <Users className="size-4" />
                  Team Attendance
                </Link>
              }
            />
          )}
          {profile?.role === "hr" && (
            <Button
              variant="default"
              nativeButton={false}
              render={
                <Link
                  href="/attendance/report"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="size-4" />
                  All Employees Report
                </Link>
              }
            />
          )}
          {(profile?.role === "manager" || profile?.role === "hr") && (
            <Button
              variant="default"
              nativeButton={false}
              render={
                <Link
                  href="/attendance/corrections"
                  className="flex items-center gap-2"
                >
                  <FileEdit className="size-4" />
                  Corrections
                </Link>
              }
            />
          )}
          <CorrectionDialog />
        </div>
      </div>

      <CheckInWidget today={todayAttendance ?? null} />
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Days Present</p>
          <p className="text-2xl font-bold">{totalPresent}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Days Late</p>
          <p className="text-2xl font-bold text-orange-600">{totalLate}</p>
        </div>
      </div>
      <AttendanceHistory
        records={history ?? []}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
