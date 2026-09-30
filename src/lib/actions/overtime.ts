"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function calculateHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return Math.round((minutes / 60) * 100) / 100;
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

export async function submitOvertimeRequest(input: {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
}) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  if (!input.reason.trim()) return { error: "Alasan wajib diisi" };
  if (input.end_time <= input.start_time)
    return { error: "Jam selesai harus setelah jam mulai" };

  const totalHours = calculateHours(input.start_time, input.end_time);
  if (totalHours <= 0 || totalHours > 12) {
    return { error: "Durasi lembur tidak valid (maksimal 12 jam)" };
  }

  const { error } = await auth.supabase.from("overtime_requests").insert({
    employee_id: auth.employeeId,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    total_hours: totalHours,
    reason: input.reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/overtime");
  return { success: true };
}

export async function cancelOvertimeRequest(id: string) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("overtime_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("employee_id", auth.employeeId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/overtime");
  return { success: true };
}

export async function reviewOvertimeAsManager(
  id: string,
  decision: "approve" | "reject",
  rejectionReason?: string
) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { data: ot } = await auth.supabase
    .from("overtime_requests")
    .select("status")
    .eq("id", id)
    .single();

  if (!ot || ot.status !== "pending")
    return { error: "Pengajuan tidak dalam status pending" };

  const { error } = await auth.supabase
    .from("overtime_requests")
    .update({
      status: decision === "approve" ? "manager_approved" : "rejected",
      manager_reviewed_by: auth.employeeId,
      manager_reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "reject" ? rejectionReason ?? null : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/overtime/approvals");
  return { success: true };
}

export async function reviewOvertimeAsHR(
  id: string,
  decision: "approve" | "reject",
  rejectionReason?: string
) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { data: ot } = await auth.supabase
    .from("overtime_requests")
    .select("status")
    .eq("id", id)
    .single();

  if (!ot) return { error: "Pengajuan tidak ditemukan" };
  if (ot.status !== "pending" && ot.status !== "manager_approved") {
    return { error: "Pengajuan ini sudah difinalisasi" };
  }

  const { error } = await auth.supabase
    .from("overtime_requests")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      hr_reviewed_by: auth.employeeId,
      hr_reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "reject" ? rejectionReason ?? null : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/overtime/approvals");
  revalidatePath("/overtime");
  return { success: true };
}
