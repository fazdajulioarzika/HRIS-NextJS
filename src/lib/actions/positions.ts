"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  positionSchema,
  type PositionInput,
} from "@/lib/validations/organization";

export async function createPosition(input: PositionInput) {
  const parsed = positionSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("positions").insert({
    name: parsed.data.name,
    department_id: parsed.data.department_id,
    description: parsed.data.description || null,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Nama posisi sudah ada di departemen ini"
          : error.message,
    };
  }

  revalidatePath("/settings/positions");
  return { success: true };
}

export async function updatePosition(id: string, input: PositionInput) {
  const parsed = positionSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .update({
      name: parsed.data.name,
      department_id: parsed.data.department_id,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Nama posisi sudah ada di departemen ini"
          : error.message,
    };
  }

  revalidatePath("/settings/positions");
  return { success: true };
}

export async function deletePosition(id: string) {
  const supabase = await createClient();

  // Catatan: kalau tabel `employees` belum punya kolom position_id, hapus blok cek ini dulu
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("position_id", id);

  if (count && count > 0) {
    return {
      error: `Tidak bisa dihapus, masih ada ${count} karyawan di posisi ini`,
    };
  }

  const { error } = await supabase.from("positions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings/positions");
  return { success: true };
}
