import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationForm } from "@/components/careers/application-form";
import Link from "next/link";
import { CareersFooter } from "@/components/careers/footer";
import { CareersHeader } from "@/components/careers/header";

export const dynamic = "force-dynamic";

function getName(rel: any): string {
  const cur = Array.isArray(rel) ? rel[0] : rel;
  return cur?.name ?? "-";
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vacancy } = await supabase
    .from("job_vacancies")
    .select(
      `id, location, employment_type, salary_min, salary_max, description, requirements, deadline, status,
       positions ( name ), departments ( name )`
    )
    .eq("id", id)
    .single();

  if (!vacancy || vacancy.status !== "published") notFound();

  return (
    <>
      <CareersHeader showBackButton />
      <div className="mx-auto max-w-2xl space-y-6 p-6 mb-16">
        <div>
          <h1 className="text-4xl font-bold mb-4">
            {getName(vacancy.positions)}
          </h1>
          <p className="text-muted-foreground">
            {getName(vacancy.departments)} · {vacancy.location} ·{" "}
            {vacancy.employment_type.replace("_", " ")}
          </p>
          {(vacancy.salary_min || vacancy.salary_max) && (
            <p className="text-sm text-muted-foreground">
              Rp{vacancy.salary_min?.toLocaleString("id-ID")} - Rp
              {vacancy.salary_max?.toLocaleString("id-ID")}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-1">Deskripsi Pekerjaan</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {vacancy.description}
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-1">Kualifikasi</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {vacancy.requirements}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="mb-4 font-semibold">Lamar Posisi Ini</h2>
          <ApplicationForm vacancyId={vacancy.id} />
        </div>
      </div>
      <CareersFooter />
    </>
  );
}
