import { redirect, notFound } from "next/navigation";
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
import { VacancyDetail } from "@/components/recruitment/vacancy-detail";

export const dynamic = "force-dynamic";

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/dashboard");

  const { data: vacancy } = await supabase
    .from("job_vacancies")
    .select(
      `id, location, status, positions ( id, name ), departments ( id, name )`
    )
    .eq("id", id)
    .single();

  if (!vacancy) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, full_name, email, phone, source, status, cv_path, applied_at")
    .eq("job_vacancy_id", id)
    .order("applied_at", { ascending: false });

  function getName(rel: any): string {
    const cur = Array.isArray(rel) ? rel[0] : rel;
    return cur?.name ?? "-";
  }
  function getId(rel: any): string {
    const cur = Array.isArray(rel) ? rel[0] : rel;
    return cur?.id ?? "";
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href="/recruitment">Recruitment</Link>}
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{getName(vacancy.positions)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <VacancyDetail
        vacancy={{
          id: vacancy.id,
          position: getName(vacancy.positions),
          positionId: getId(vacancy.positions),
          departmentId: getId(vacancy.departments),
          department: getName(vacancy.departments),
          location: vacancy.location,
          status: vacancy.status,
        }}
        candidates={candidates ?? []}
      />
    </div>
  );
}
