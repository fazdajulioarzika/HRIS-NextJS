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
import {
  getJakartaDateString,
  getCurrentMonthString,
  getMonthRange,
} from "@/lib/utils/attendance-date";
import { AttendanceReportTabs } from "@/components/attendance/attendance-report-tabs";

export const dynamic = "force-dynamic";

function getFullName(profiles: any): string {
  if (!profiles) return "-";
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "-";
  return profiles.full_name ?? "-";
}
function getDeptName(departments: any): string {
  if (!departments) return "-";
  if (Array.isArray(departments)) return departments[0]?.name ?? "-";
  return departments.name ?? "-";
}
function getPosName(positions: any): string {
  if (!positions) return "-";
  if (Array.isArray(positions)) return positions[0]?.name ?? "-";
  return positions.name ?? "-";
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; month?: string }>;
}) {
  const { view = "daily", date, month } = await searchParams;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/attendance");

  const { data: employees } = await supabase
    .from("employees")
    .select(
      `id, employment_status,
       profiles ( full_name ),
       departments ( name ),
       positions ( name )`
    )
    .in("employment_status", ["active", "probation", "contract", "permanent"]);

  const employeeRows = (employees ?? []).map((e: any) => ({
    id: e.id,
    full_name: getFullName(e.profiles),
    department: getDeptName(e.departments),
    position: getPosName(e.positions),
  }));

  let dailyData: any = null;
  let monthlyData: any = null;

  if (view === "daily") {
    const selectedDate = date ?? getJakartaDateString();

    const { data: attendance } = await supabase
      .from("attendance")
      .select("employee_id, check_in, check_out, status, late_minutes")
      .eq("date", selectedDate);

    const attendanceMap = new Map(
      (attendance ?? []).map((a) => [a.employee_id, a])
    );

    const rows = employeeRows.map((emp) => {
      const record = attendanceMap.get(emp.id);
      return {
        ...emp,
        check_in: record?.check_in ?? null,
        check_out: record?.check_out ?? null,
        status: record?.status ?? null,
        late_minutes: record?.late_minutes ?? 0,
      };
    });

    const isPastDate = selectedDate < getJakartaDateString();
    const presentCount = rows.filter((r) => r.status).length;
    const lateCount = rows.filter((r) => r.status === "late").length;
    const absentCount = isPastDate ? rows.filter((r) => !r.status).length : 0;
    const notYetCount = !isPastDate ? rows.filter((r) => !r.status).length : 0;

    dailyData = {
      selectedDate,
      rows,
      summary: {
        total: rows.length,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        notYet: notYetCount,
      },
      isPastDate,
    };
  } else {
    const selectedMonth = month ?? getCurrentMonthString();
    const { start, end } = getMonthRange(selectedMonth);

    const { data: attendance } = await supabase
      .from("attendance")
      .select("employee_id, status, late_minutes, date")
      .gte("date", start)
      .lte("date", end);

    const grouped = new Map<
      string,
      { present: number; late: number; totalLateMinutes: number }
    >();
    for (const a of attendance ?? []) {
      const entry = grouped.get(a.employee_id) ?? {
        present: 0,
        late: 0,
        totalLateMinutes: 0,
      };
      entry.present += 1;
      if (a.status === "late") {
        entry.late += 1;
        entry.totalLateMinutes += a.late_minutes ?? 0;
      }
      grouped.set(a.employee_id, entry);
    }

    const rows = employeeRows.map((emp) => {
      const stat = grouped.get(emp.id) ?? {
        present: 0,
        late: 0,
        totalLateMinutes: 0,
      };
      return { ...emp, ...stat };
    });

    monthlyData = { selectedMonth, rows };
  }

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
            <BreadcrumbPage>Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Attendance Report</h1>
        <p className="text-muted-foreground">
          Rekap kehadiran seluruh karyawan.
        </p>
      </div>

      <AttendanceReportTabs
        view={view}
        dailyData={dailyData}
        monthlyData={monthlyData}
      />
    </div>
  );
}
