export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { EmployeeTable } from "@/components/employees/employee-table";
import type { EmployeeRow, ManagerOption } from "@/components/employees/types";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const [
    { data: employees },
    { data: departments },
    { data: positions },
    { data: managers },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select(
        `id, profile_id, nik, phone, address, birth_date, join_date, employment_status, basic_salary,
   department_id, position_id, manager_id,photo_url,
   profiles ( full_name, email, avatar_url ),
   departments ( name ),
   positions ( name )`
      )
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("positions").select("id, name, department_id").order("name"),
    supabase
      .from("employees")
      .select("id, profiles!inner ( full_name, role )")
      .in("profiles.role", ["hr", "manager"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground">
          Kelola data karyawan perusahaan Anda.
        </p>
      </div>

      <EmployeeTable
        initialEmployees={(employees ?? []) as unknown as EmployeeRow[]}
        departments={departments ?? []}
        positions={positions ?? []}
        managers={(managers ?? []) as unknown as ManagerOption[]}
      />
    </div>
  );
}
