import { createClient } from "@/lib/supabase/server";
import { CareersList } from "@/components/careers/careers-list";
import { CareersFooter } from "@/components/careers/footer";
import { CareersHeader } from "@/components/careers/header";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const supabase = await createClient();

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select(
      "id, location, employment_type, salary_min, salary_max, deadline, created_at, positions ( name ), departments ( name )"
    )
    .eq("status", "published")
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
    created_at: v.created_at,
  }));

  return (
    <div className="mx-auto w-full space-y-6">
      <CareersHeader showBackButton={false} />

      <div className="w-full items-center justify-center text-center">
        <h1 className="text-3xl font-bold">Lowongan Kerja</h1>
      </div>

      <div className="mx-auto max-w-full items-center justify-center p-6 lg:max-w-6xl">
        <CareersList vacancies={rows} />
      </div>
      <CareersFooter />
    </div>
  );
}
