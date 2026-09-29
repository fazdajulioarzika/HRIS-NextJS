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
import { TeamAttendanceTable } from "@/components/attendance/team-attendance-table";

export const dynamic = "force-dynamic";

function getFullName(profiles: any): string {
  if (!profiles) return "-";
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "-";
  return profiles.full_name ?? "-";
}

export default async function TeamAttendancePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: myEmployee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.user.id)
    .single();

  if (!myEmployee) {
    return (
      <div className="text-muted-foreground">
        Data karyawan Anda belum lengkap.
      </div>
    );
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const { data: team } = await supabase
    .from("employees")
    .select(
      `id, profiles ( full_name ),
       attendance ( check_in, check_out, status, late_minutes, date )`
    )
    .eq("manager_id", myEmployee.id);

  const rows = (team ?? []).map((member: any) => {
    const attendanceList = Array.isArray(member.attendance)
      ? member.attendance
      : [];
    const todayRecord =
      attendanceList.find((a: any) => a.date === today) ?? null;

    return {
      id: member.id,
      full_name: getFullName(member.profiles),
      check_in: todayRecord?.check_in ?? null,
      check_out: todayRecord?.check_out ?? null,
      status: todayRecord?.status ?? null,
      late_minutes: todayRecord?.late_minutes ?? 0,
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
            <BreadcrumbPage>Team</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Team Attendance</h1>
        <p className="text-muted-foreground">
          Status kehadiran anggota tim Anda hari ini.
        </p>
      </div>

      <TeamAttendanceTable rows={rows} />
    </div>
  );
}
