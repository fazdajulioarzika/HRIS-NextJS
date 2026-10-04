import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock3, Timer, UserX, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function getJakartaDateString(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    date
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  const role = profile?.role ?? "employee";

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.user.id)
    .single();

  if (role === "hr") return <HRDashboard supabase={supabase} />;
  if (role === "manager" && employee)
    return <ManagerDashboard supabase={supabase} managerId={employee.id} />;
  if (employee)
    return <EmployeeDashboard supabase={supabase} employeeId={employee.id} />;

  return (
    <div className="text-muted-foreground">
      Data karyawan Anda belum lengkap. Hubungi HR.
    </div>
  );
}

async function HRDashboard({ supabase }: { supabase: any }) {
  const today = getJakartaDateString();

  const [
    { count: totalEmployees },
    { data: todayAttendance },
    { count: cutiPending },
    { count: lemburPending },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .in("employment_status", [
        "active",
        "permanent",
        "contract",
        "probation",
      ]),
    supabase.from("attendance").select("status").eq("date", today),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "manager_approved"]),
    supabase
      .from("overtime_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "manager_approved"]),
  ]);

  const hadirHariIni = (todayAttendance ?? []).length;
  const terlambat = (todayAttendance ?? []).filter(
    (a: any) => a.status === "late"
  ).length;
  const tidakHadir = (totalEmployees ?? 0) - hadirHariIni;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard HR</h1>
        <p className="text-muted-foreground">
          Ringkasan kondisi perusahaan hari ini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Karyawan"
          value={totalEmployees ?? 0}
        />
        <StatCard
          icon={Clock3}
          label="Hadir Hari Ini"
          value={hadirHariIni}
          valueClass="text-green-600"
        />
        <StatCard
          icon={Clock3}
          label="Terlambat"
          value={terlambat}
          valueClass="text-orange-600"
        />
        <StatCard
          icon={UserX}
          label="Tidak Hadir"
          value={Math.max(0, tidakHadir)}
          valueClass="text-destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cuti Pending</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{cutiPending ?? 0}</p>
            <Button
              variant="link"
              className="h-auto p-0"
              nativeButton={false}
              render={<Link href="/leave/approvals">Review pengajuan →</Link>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lembur Pending</CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lemburPending ?? 0}</p>
            <Button
              variant="link"
              className="h-auto p-0"
              nativeButton={false}
              render={
                <Link href="/overtime/approvals">Review pengajuan →</Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function ManagerDashboard({
  supabase,
  managerId,
}: {
  supabase: any;
  managerId: string;
}) {
  const today = getJakartaDateString();

  const [{ count: teamSize }, { data: team }] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("manager_id", managerId),
    supabase.from("employees").select("id").eq("manager_id", managerId),
  ]);

  const teamIds = (team ?? []).map((e: any) => e.id);

  // Query berikutnya BARU bisa jalan setelah teamIds didapat, tapi ketiganya sendiri independen satu sama lain
  const [
    { data: todayAttendance },
    { count: cutiPending },
    { count: lemburPending },
  ] = teamIds.length
    ? await Promise.all([
        supabase
          .from("attendance")
          .select("status")
          .eq("date", today)
          .in("employee_id", teamIds),
        supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("employee_id", teamIds),
        supabase
          .from("overtime_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("employee_id", teamIds),
      ])
    : [{ data: [] }, { count: 0 }, { count: 0 }];

  const hadir = (todayAttendance ?? []).length;
  const terlambat = (todayAttendance ?? []).filter(
    (a: any) => a.status === "late"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan tim Anda hari ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Anggota Tim" value={teamSize ?? 0} />
        <StatCard
          icon={Clock3}
          label="Hadir Hari Ini"
          value={hadir}
          valueClass="text-green-600"
        />
        <StatCard
          icon={Clock3}
          label="Terlambat"
          value={terlambat}
          valueClass="text-orange-600"
        />
        <StatCard
          icon={Users}
          label="Belum Absen"
          value={Math.max(0, (teamSize ?? 0) - hadir)}
          valueClass="text-destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cuti Menunggu Approval</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{cutiPending ?? 0}</p>
            <Button
              variant="link"
              className="h-auto p-0"
              nativeButton={false}
              render={<Link href="/leave/approvals">Review pengajuan →</Link>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Lembur Menunggu Approval
            </CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lemburPending ?? 0}</p>
            <Button
              variant="link"
              className="h-auto p-0"
              nativeButton={false}
              render={
                <Link href="/overtime/approvals">Review pengajuan →</Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function EmployeeDashboard({
  supabase,
  employeeId,
}: {
  supabase: any;
  employeeId: string;
}) {
  const today = getJakartaDateString();
  const currentYear = new Date().getFullYear();

  const [
    { data: todayAttendance },
    { data: balances },
    { count: myPendingLeave },
    { count: myPendingOvertime },
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("check_in, check_out, status")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .single(),
    supabase
      .from("leave_balances")
      .select("total_days, used_days, leave_types ( name )")
      .eq("employee_id", employeeId)
      .eq("year", currentYear),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .in("status", ["pending", "manager_approved"]),
    supabase
      .from("overtime_requests")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .in("status", ["pending", "manager_approved"]),
  ]);

  const cutiTahunan = (balances ?? []).find((b: any) => {
    const name = Array.isArray(b.leave_types)
      ? b.leave_types[0]?.name
      : b.leave_types?.name;
    return name === "Cuti Tahunan";
  });
  const sisaCuti = cutiTahunan
    ? cutiTahunan.total_days - cutiTahunan.used_days
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan aktivitas Anda hari ini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Status Hari Ini</p>
            <p className="text-lg font-bold">
              {!todayAttendance
                ? "Belum Check-in"
                : !todayAttendance.check_out
                ? "Sedang Bekerja"
                : "Selesai"}
            </p>
          </CardContent>
        </Card>
        <StatCard
          icon={CalendarDays}
          label="Sisa Cuti Tahunan"
          value={sisaCuti}
        />
        <StatCard
          icon={CalendarDays}
          label="Cuti Pending"
          value={myPendingLeave ?? 0}
          valueClass="text-orange-600"
        />
        <StatCard
          icon={Timer}
          label="Lembur Pending"
          value={myPendingOvertime ?? 0}
          valueClass="text-orange-600"
        />
      </div>

      <div className="flex gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/attendance">Buka Attendance</Link>}
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/leave">Ajukan Cuti</Link>}
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/overtime">Ajukan Lembur</Link>}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: any;
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className={`text-2xl font-bold ${valueClass ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
