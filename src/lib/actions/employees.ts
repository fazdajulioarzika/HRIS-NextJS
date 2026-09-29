"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/lib/validations/employee";

async function requireHR() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "Not authenticated" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (caller?.role !== "hr") {
    return {
      ok: false as const,
      error: "Hanya HR yang bisa melakukan aksi ini",
    };
  }
  return { ok: true as const, supabase };
}
export async function deactivateEmployee(
  id: string,
  status: "resigned" | "terminated"
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("employees")
    .update({ employment_status: status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/employees");
  return { success: true };
}

export async function createEmployee(input: CreateEmployeeInput) {
  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const admin = createAdminClient();

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { full_name: parsed.data.full_name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    });

  if (inviteError || !invited.user) {
    return {
      error: inviteError?.message.toLowerCase().includes("already registered")
        ? "Email ini sudah terdaftar"
        : inviteError?.message ?? "Gagal mengundang karyawan",
    };
  }

  const { data: newEmployee, error: empError } = await auth.supabase
    .from("employees")
    .insert({
      profile_id: invited.user.id,
      nik: parsed.data.nik,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      birth_date: parsed.data.birth_date || null,
      join_date: parsed.data.join_date,
      department_id: parsed.data.department_id,
      position_id: parsed.data.position_id,
      manager_id: parsed.data.manager_id || null,
      basic_salary: parsed.data.basic_salary,
      employment_status: parsed.data.employment_status,
    })
    .select("id")
    .single();

  if (empError) {
    // Rollback akun auth kalau insert employee gagal, supaya tidak ada
    // akun "menggantung" tanpa data kepegawaian.
    await admin.auth.admin.deleteUser(invited.user.id);
    return {
      error:
        empError.code === "23505" ? "NIK sudah digunakan" : empError.message,
    };
  }

  revalidatePath("/employees");
  return { success: true, employeeId: newEmployee.id };
}

export async function updateEmployee(
  id: string,
  profileId: string,
  input: UpdateEmployeeInput
) {
  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  if (parsed.data.manager_id === id) {
    return { error: "Karyawan tidak bisa jadi manager untuk dirinya sendiri" };
  }

  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error: empError } = await auth.supabase
    .from("employees")
    .update({
      nik: parsed.data.nik,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      birth_date: parsed.data.birth_date || null,
      join_date: parsed.data.join_date,
      department_id: parsed.data.department_id,
      position_id: parsed.data.position_id,
      manager_id: parsed.data.manager_id || null,
      basic_salary: parsed.data.basic_salary,
      employment_status: parsed.data.employment_status,
    })
    .eq("id", id);

  if (empError) {
    return {
      error:
        empError.code === "23505" ? "NIK sudah digunakan" : empError.message,
    };
  }

  // updateEmployee, setelah update employees berhasil
  const { data: profileData, error: profileError } = await auth.supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", profileId);
  if (profileError) return { error: profileError.message };

  revalidatePath("/employees");
  return { success: true };
}
export async function updateEmployeePhoto(id: string, photoUrl: string) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("employees")
    .update({ photo_url: photoUrl })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/employees");
  return { success: true };
}
