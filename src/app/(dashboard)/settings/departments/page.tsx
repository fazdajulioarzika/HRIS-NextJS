import { createClient } from "@/lib/supabase/server";
import { DepartmentTable } from "@/components/settings/departments/department-table";

export default async function DepartmentsPage() {
  const supabase = await createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, description, created_at")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Departments</h2>
        <p className="text-sm text-muted-foreground">
          Kelola departemen di perusahaan Anda.
        </p>
      </div>
      <DepartmentTable initialDepartments={departments ?? []} />
    </div>
  );
}
