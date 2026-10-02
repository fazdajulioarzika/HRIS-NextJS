"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countBusinessDays } from "@/lib/utils/leave-date";

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

export async function submitLeaveRequest(input: {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  if (!input.reason.trim()) return { error: "Alasan wajib diisi" };
  if (input.end_date < input.start_date)
    return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai" };

  const totalDays = countBusinessDays(input.start_date, input.end_date);
  if (totalDays <= 0)
    return { error: "Rentang tanggal tidak valid (harus mencakup hari kerja)" };

  const year = new Date(input.start_date).getFullYear();

  const { data: balance } = await auth.supabase
    .from("leave_balances")
    .select("total_days, used_days")
    .eq("employee_id", auth.employeeId)
    .eq("leave_type_id", input.leave_type_id)
    .eq("year", year)
    .single();

  if (balance) {
    const remaining = balance.total_days - balance.used_days;
    if (totalDays > remaining) {
      return {
        error: `Sisa cuti tidak cukup. Sisa: ${remaining} hari, diajukan: ${totalDays} hari`,
      };
    }
  }

  const { error } = await auth.supabase.from("leave_requests").insert({
    employee_id: auth.employeeId,
    leave_type_id: input.leave_type_id,
    start_date: input.start_date,
    end_date: input.end_date,
    total_days: totalDays,
    reason: input.reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/leave");
  return { success: true };
}

export async function cancelLeaveRequest(id: string) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("employee_id", auth.employeeId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/leave");
  return { success: true };
}

export async function reviewLeaveAsManager(
  id: string,
  decision: "approve" | "reject",
  rejectionReason?: string
) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { data: leave } = await auth.supabase
    .from("leave_requests")
    .select("status")
    .eq("id", id)
    .single();

  if (!leave || leave.status !== "pending")
    return { error: "Pengajuan tidak dalam status pending" };

  const { error } = await auth.supabase
    .from("leave_requests")
    .update({
      status: decision === "approve" ? "manager_approved" : "rejected",
      manager_reviewed_by: auth.employeeId,
      manager_reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "reject" ? rejectionReason ?? null : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/leave/approvals");
  return { success: true };
}

export async function reviewLeaveAsHR(
  id: string,
  decision: "approve" | "reject",
  rejectionReason?: string
) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const { data: leave } = await auth.supabase
    .from("leave_requests")
    .select(
      "status, employee_id, leave_type_id, total_days, start_date, end_date"
    )
    .eq("id", id)
    .single();

  if (!leave) return { error: "Pengajuan tidak ditemukan" };
  if (leave.status !== "pending" && leave.status !== "manager_approved") {
    return { error: "Pengajuan ini sudah difinalisasi" };
  }

  const { error } = await auth.supabase
    .from("leave_requests")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      hr_reviewed_by: auth.employeeId,
      hr_reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "reject" ? rejectionReason ?? null : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (decision === "approve") {
    // 1. Potong saldo cuti
    const year = new Date(leave.start_date).getFullYear();
    const { data: balance } = await auth.supabase
      .from("leave_balances")
      .select("id, used_days")
      .eq("employee_id", leave.employee_id)
      .eq("leave_type_id", leave.leave_type_id)
      .eq("year", year)
      .single();

    if (balance) {
      await auth.supabase
        .from("leave_balances")
        .update({ used_days: balance.used_days + leave.total_days })
        .eq("id", balance.id);
    }

    // 2. Buat record attendance "leave" untuk setiap hari kerja dalam rentang cuti
    //    supaya tidak dihitung sebagai absen saat generate payroll
    const attendanceRows: any[] = [];
    let cur = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        attendanceRows.push({
          employee_id: leave.employee_id,
          date: cur.toISOString().slice(0, 10),
          status: "leave",
          late_minutes: 0,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (attendanceRows.length > 0) {
      // upsert supaya tidak error kalau kebetulan sudah ada record di tanggal itu
      await auth.supabase
        .from("attendance")
        .upsert(attendanceRows, { onConflict: "employee_id,date" });
    }
  }

  revalidatePath("/leave/approvals");
  revalidatePath("/leave");
  revalidatePath("/attendance");
  return { success: true };
}
