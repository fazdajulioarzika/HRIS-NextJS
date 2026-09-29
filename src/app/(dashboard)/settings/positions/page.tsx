import { createClient } from "@/lib/supabase/server";
import { PositionTable } from "@/components/settings/positions/position-table";

interface PositionRow {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  departments: { name: string } | null;
}

export default async function PositionsPage() {
  const supabase = await createClient();

  const [{ data: positions }, { data: departments }] = await Promise.all([
    supabase
      .from("positions")
      .select("id, name, description, department_id, departments(name)")
      .order("name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Positions</h2>
        <p className="text-sm text-muted-foreground">
          Kelola posisi/jabatan di setiap departemen.
        </p>
      </div>
      <PositionTable
        initialPositions={(positions ?? []) as unknown as PositionRow[]}
        departments={departments ?? []}
      />
    </div>
  );
}
