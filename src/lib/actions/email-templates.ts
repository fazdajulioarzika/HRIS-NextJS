"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireHR() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "Not authenticated" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (caller?.role !== "hr")
    return {
      ok: false as const,
      error: "Hanya HR yang bisa melakukan aksi ini",
    };

  return { ok: true as const, supabase };
}

export async function updateEmailTemplate(
  statusKey: string,
  input: { subject: string; body: string }
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  if (!input.subject.trim() || !input.body.trim()) {
    return { error: "Subject dan body wajib diisi" };
  }

  const { error } = await auth.supabase
    .from("email_templates")
    .update({
      subject: input.subject,
      body: input.body,
      updated_at: new Date().toISOString(),
    })
    .eq("status_key", statusKey);

  if (error) return { error: error.message };

  revalidatePath("/recruitment/email-templates");
  return { success: true };
}
