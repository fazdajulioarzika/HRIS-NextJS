"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
const OFFICE_START_MINUTES = 8 * 60; // 08:00

function getMinutesFromTimeString(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
async function getMyEmployeeId() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "Not authenticated" };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.user.id)
    .single();

  if (!employee)
    return { ok: false as const, error: "Data karyawan tidak ditemukan" };
  return { ok: true as const, supabase, employeeId: employee.id };
}

export async function submitCorrection(input: {
  date: string;
  requested_check_in: string;
  requested_check_out: string;
  reason: string;
}) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  if (!input.reason.trim()) return { error: "Alasan wajib diisi" };
  if (!input.requested_check_in && !input.requested_check_out) {
    return { error: "Isi minimal salah satu: check-in atau check-out" };
  }

  const { error } = await auth.supabase.from("attendance_corrections").insert({
    employee_id: auth.employeeId,
    date: input.date,
    requested_check_in: input.requested_check_in || null,
    requested_check_out: input.requested_check_out || null,
    reason: input.reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}

export async function reviewCorrection(
  id: string,
  decision: "approved" | "rejected"
) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();
  const { data: auth2 } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth2.user!.id)
    .single();

  if (profile?.role !== "manager" && profile?.role !== "hr") {
    return { error: "Hanya Manager atau HR yang bisa mereview" };
  }

  const { data: correction, error: fetchError } = await auth.supabase
    .from("attendance_corrections")
    .select(
      "id, employee_id, date, requested_check_in, requested_check_out, status"
    )
    .eq("id", id)
    .single();

  if (fetchError || !correction) return { error: "Pengajuan tidak ditemukan" };
  if (correction.status !== "pending")
    return { error: "Pengajuan ini sudah direview" };

  const { error: updateError } = await auth.supabase
    .from("attendance_corrections")
    .update({
      status: decision,
      reviewed_by: auth.employeeId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Kalau disetujui, terapkan ke tabel attendance (upsert)
  if (decision === "approved") {
    const checkInIso = correction.requested_check_in
      ? `${correction.date}T${correction.requested_check_in}+07:00`
      : undefined;
    const checkOutIso = correction.requested_check_out
      ? `${correction.date}T${correction.requested_check_out}+07:00`
      : undefined;

    // Hitung ulang status & late_minutes berdasarkan jam check-in yang dikoreksi
    let statusUpdate: Record<string, any> = {};
    if (correction.requested_check_in) {
      const jakartaMinutes = getMinutesFromTimeString(
        correction.requested_check_in
      );
      const lateMinutes = Math.max(0, jakartaMinutes - OFFICE_START_MINUTES);
      statusUpdate = {
        status: lateMinutes > 0 ? "late" : "present",
        late_minutes: lateMinutes,
      };
    }

    // Hitung ulang work_minutes kalau kedua jam tersedia
    let workMinutesUpdate: Record<string, any> = {};
    if (correction.requested_check_in && correction.requested_check_out) {
      const inMinutes = getMinutesFromTimeString(correction.requested_check_in);
      const outMinutes = getMinutesFromTimeString(
        correction.requested_check_out
      );
      workMinutesUpdate = { work_minutes: Math.max(0, outMinutes - inMinutes) };
    }

    const { data: existing } = await auth.supabase
      .from("attendance")
      .select("id, check_in, check_out")
      .eq("employee_id", correction.employee_id)
      .eq("date", correction.date)
      .single();

    if (existing) {
      const updatePayload: Record<string, any> = {
        ...statusUpdate,
        ...workMinutesUpdate,
      };
      if (checkInIso)
        updatePayload.check_in = new Date(checkInIso).toISOString();
      if (checkOutIso)
        updatePayload.check_out = new Date(checkOutIso).toISOString();

      await auth.supabase
        .from("attendance")
        .update(updatePayload)
        .eq("id", existing.id);
    } else {
      await auth.supabase.from("attendance").insert({
        employee_id: correction.employee_id,
        date: correction.date,
        check_in: checkInIso ? new Date(checkInIso).toISOString() : null,
        check_out: checkOutIso ? new Date(checkOutIso).toISOString() : null,
        ...statusUpdate,
        ...workMinutesUpdate,
      });
    }
  }

  revalidatePath("/attendance");
  revalidatePath("/attendance/corrections");
  return { success: true };
}
