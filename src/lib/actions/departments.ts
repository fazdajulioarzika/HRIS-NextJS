"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/lib/validations/organization";

export async function createDepartment(input: DepartmentInput) {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  if (error) {
    return {
      error:
        error.code === "23505" ? "Nama departemen sudah ada" : error.message,
    };
  }

  revalidatePath("/settings/departments");
  return { success: true };
}

export async function updateDepartment(id: string, input: DepartmentInput) {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23505" ? "Nama departemen sudah ada" : error.message,
    };
  }

  revalidatePath("/settings/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("positions")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);

  if (count && count > 0) {
    return {
      error: `Tidak bisa dihapus, masih ada ${count} posisi di departemen ini`,
    };
  }

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings/departments");
  return { success: true };
}
