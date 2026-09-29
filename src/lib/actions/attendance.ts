"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OFFICE_START_MINUTES = 8 * 60; // 08:00

function getJakartaMinutes(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hour, minute] = formatter.format(date).split(":").map(Number);
  return hour * 60 + minute;
}

function getJakartaDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    date
  );
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

export async function checkIn(input: {
  latitude: number | null;
  longitude: number | null;
}) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const now = new Date();
  const today = getJakartaDateString(now);
  const jakartaMinutes = getJakartaMinutes(now);
  const lateMinutes = Math.max(0, jakartaMinutes - OFFICE_START_MINUTES);

  const { error } = await auth.supabase.from("attendance").insert({
    employee_id: auth.employeeId,
    date: today,
    check_in: now.toISOString(),
    check_in_lat: input.latitude,
    check_in_lng: input.longitude,
    status: lateMinutes > 0 ? "late" : "present",
    late_minutes: lateMinutes,
  });

  if (error) {
    return {
      error:
        error.code === "23505" ? "Anda sudah check-in hari ini" : error.message,
    };
  }

  revalidatePath("/attendance");
  return { success: true };
}

export async function checkOut(input: {
  latitude: number | null;
  longitude: number | null;
}) {
  const auth = await getMyEmployeeId();
  if (!auth.ok) return { error: auth.error };

  const now = new Date();
  const today = getJakartaDateString(now);

  const { data: existing } = await auth.supabase
    .from("attendance")
    .select("id, check_in, check_out")
    .eq("employee_id", auth.employeeId)
    .eq("date", today)
    .single();

  if (!existing) return { error: "Anda belum check-in hari ini" };
  if (existing.check_out) return { error: "Anda sudah check-out hari ini" };

  const checkInTime = new Date(existing.check_in);
  const workMinutes = Math.round(
    (now.getTime() - checkInTime.getTime()) / 60000
  );

  const { error } = await auth.supabase
    .from("attendance")
    .update({
      check_out: now.toISOString(),
      check_out_lat: input.latitude,
      check_out_lng: input.longitude,
      work_minutes: workMinutes,
    })
    .eq("id", existing.id);

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}
