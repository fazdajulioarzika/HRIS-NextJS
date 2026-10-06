import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailTemplateList } from "@/components/recruitment/email-template-list";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "hr") redirect("/recruitment");

  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, status_key, subject, body")
    .order("status_key");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">
          Kustomisasi email yang dikirim otomatis ke kandidat di setiap status.
        </p>
      </div>

      <EmailTemplateList templates={templates ?? []} />
    </div>
  );
}
