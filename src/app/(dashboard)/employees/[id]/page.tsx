import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeDocuments } from "@/components/employees/employee-documents";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select(
      `id, nik, phone, address, join_date, employment_status, photo_url,
       profiles ( full_name, email ),
       departments ( name ),
       positions ( name )`
    )
    .eq("id", id)
    .single();

  if (!employee) notFound();

  const { data: documents } = await supabase
    .from("employee_documents")
    .select("id, document_type, file_name, file_path, uploaded_at")
    .eq("employee_id", id)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/employees">Employees</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {(employee as any).profiles?.full_name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold">
          {(employee as any).profiles?.full_name}
        </h1>
        <p className="text-muted-foreground">
          {(employee as any).positions?.name} ·{" "}
          {(employee as any).departments?.name}
        </p>
      </div>

      <EmployeeDocuments employeeId={id} initialDocuments={documents ?? []} />
    </div>
  );
}
