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

export async function addEmployeeDocument(input: {
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
}) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("employee_documents")
    .insert(input);
  if (error) return { error: error.message };

  revalidatePath(`/employees/${input.employee_id}`);
  return { success: true };
}

export async function deleteEmployeeDocument(id: string, filePath: string) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  await auth.supabase.storage.from("employee-documents").remove([filePath]);

  const { error } = await auth.supabase
    .from("employee_documents")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/employees");
  return { success: true };
}
