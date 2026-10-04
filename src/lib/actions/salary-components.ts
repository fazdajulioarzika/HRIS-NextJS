"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  salaryComponentSchema,
  type SalaryComponentInput,
} from "@/lib/validations/salary-component";

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

export async function createSalaryComponent(input: SalaryComponentInput) {
  const parsed = salaryComponentSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("salary_components")
    .insert(parsed.data);
  if (error) {
    return {
      error: error.code === "23505" ? "Nama komponen sudah ada" : error.message,
    };
  }

  revalidatePath("/payroll/components");
  return { success: true };
}

export async function updateSalaryComponent(
  id: string,
  input: SalaryComponentInput
) {
  const parsed = salaryComponentSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("salary_components")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return {
      error: error.code === "23505" ? "Nama komponen sudah ada" : error.message,
    };
  }

  revalidatePath("/payroll/components");
  return { success: true };
}

export async function deleteSalaryComponent(id: string) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("salary_components")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/payroll/components");
  return { success: true };
}

export async function toggleSalaryComponentActive(
  id: string,
  isActive: boolean
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("salary_components")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/payroll/components");
  return { success: true };
}
