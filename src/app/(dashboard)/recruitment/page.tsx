import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VacancyList } from "@/components/recruitment/vacancy-list";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/dashboard");

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select(
      `id, location, employment_type, status, deadline,
       positions ( name ), departments ( name ),
       candidates ( id )`
    )
    .order("created_at", { ascending: false });

  function getName(rel: any): string {
    const cur = Array.isArray(rel) ? rel[0] : rel;
    return cur?.name ?? "-";
  }

  const rows = (vacancies ?? []).map((v: any) => ({
    id: v.id,
    position: getName(v.positions),
    department: getName(v.departments),
    location: v.location,
    employment_type: v.employment_type,
    status: v.status,
    deadline: v.deadline,
    candidateCount: Array.isArray(v.candidates) ? v.candidates.length : 0,
  }));

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");
  const { data: positions } = await supabase
    .from("positions")
    .select("id, name, department_id")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recruitment</h1>
        <p className="text-muted-foreground">Kelola lowongan dan kandidat.</p>
      </div>

      <VacancyList
        vacancies={rows}
        departments={departments ?? []}
        positions={positions ?? []}
      />
    </div>
  );
}
