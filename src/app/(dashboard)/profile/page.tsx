import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyProfileForm } from "@/components/profile/my-profile-form";
import { MyDocuments } from "@/components/profile/my-documents";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", auth.user.id)
    .single();

  const { data: employee } = await supabase
    .from("employees")
    .select(
      `id, nik, phone, address, birth_date, join_date, employment_status, photo_url,
     departments ( name ), positions ( name ),
     manager:manager_id ( profiles ( full_name ) )`
    )
    .eq("profile_id", auth.user.id)
    .single();
  const { data: documents } = await supabase
    .from("employee_documents")
    .select("id, document_type, file_name, file_path, uploaded_at")
    .eq("employee_id", employee?.id ?? "")
    .order("uploaded_at", { ascending: false });

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Lihat dan perbarui informasi kontak Anda.
        </p>
      </div>

      <MyProfileForm profile={profile} employee={employee as any} />
      <MyDocuments documents={documents ?? []} />
    </div>
  );
}
