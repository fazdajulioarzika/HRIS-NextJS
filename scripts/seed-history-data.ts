import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Helpers ────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickWeighted<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    if (r < o.weight) return o.value;
    r -= o.weight;
  }
  return options[options.length - 1].value;
}
function countBusinessDays(start: Date, end: Date) {
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    if (!isWeekend(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}
function toTimestamp(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

const TODAY = new Date();
const RANGE_START = addDays(TODAY, -90); // 3 bulan ke belakang

async function main() {
  console.log("Mengambil data employees, leave_types...");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, join_date, employment_status")
    .in("employment_status", ["active", "permanent", "contract", "probation"]);

  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("id, name, default_days");

  if (!employees || employees.length === 0) {
    console.error("Tidak ada employee aktif ditemukan.");
    return;
  }
  if (!leaveTypes || leaveTypes.length === 0) {
    console.error("Tidak ada leave_types ditemukan.");
    return;
  }

  console.log(`Memproses ${employees.length} employees...`);

  const attendanceRows: any[] = [];
  const leaveRows: any[] = [];
  const overtimeRows: any[] = [];
  const balanceUpdates = new Map<string, number>(); // key: employeeId|leaveTypeId -> used_days to add

  for (const emp of employees) {
    const empJoinDate = emp.join_date ? new Date(emp.join_date) : RANGE_START;
    const rangeStart = empJoinDate > RANGE_START ? empJoinDate : RANGE_START;
    if (rangeStart >= TODAY) continue;

    // ── 1. Generate leave requests (0–2 per employee) ──
    const leaveCount = randomInt(0, 2);
    const approvedLeaveDates = new Set<string>(); // "YYYY-MM-DD" yang ter-cover cuti approved

    for (let i = 0; i < leaveCount; i++) {
      const type = leaveTypes[randomInt(0, leaveTypes.length - 1)];
      const maxDuration = type.name === "Cuti Melahirkan" ? 1 : randomInt(1, 3); // batasi durasi biar tidak makan seluruh saldo
      const totalDays = Math.min(maxDuration, type.default_days);

      // pilih tanggal mulai acak dalam range, sisakan ruang untuk durasi
      const spanDays = Math.max(
        1,
        countBusinessDays(rangeStart, TODAY) - totalDays - 5
      );
      if (spanDays <= 0) continue;

      let startDate = addDays(rangeStart, randomInt(0, spanDays));
      while (isWeekend(startDate)) startDate = addDays(startDate, 1);

      let endDate = new Date(startDate);
      let added = 0;
      while (added < totalDays - 1) {
        endDate = addDays(endDate, 1);
        if (!isWeekend(endDate)) added++;
      }
      if (endDate >= TODAY) continue;

      const status = pickWeighted([
        { value: "approved", weight: 70 },
        { value: "rejected", weight: 15 },
        { value: "manager_approved", weight: 5 },
        { value: "pending", weight: 10 },
      ]);

      const key = `${emp.id}|${type.id}`;
      const alreadyUsed = balanceUpdates.get(key) ?? 0;
      if (status === "approved" && alreadyUsed + totalDays > type.default_days)
        continue; // jangan lebihi saldo

      leaveRows.push({
        employee_id: emp.id,
        leave_type_id: type.id,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        total_days: totalDays,
        reason: pickWeighted([
          { value: "Keperluan keluarga", weight: 3 },
          { value: "Sakit", weight: 2 },
          { value: "Acara pribadi", weight: 2 },
          { value: "Istirahat", weight: 1 },
        ]),
        status,
        rejection_reason:
          status === "rejected" ? "Bertepatan dengan periode sibuk" : null,
      });

      if (status === "approved") {
        balanceUpdates.set(key, alreadyUsed + totalDays);

        // tandai tanggal ini sebagai "leave" supaya tidak ada attendance di hari yang sama
        let cur = new Date(startDate);
        while (cur <= endDate) {
          if (!isWeekend(cur)) approvedLeaveDates.add(formatDate(cur));
          cur = addDays(cur, 1);
        }
      }
    }

    // ── 2. Generate attendance untuk setiap hari kerja ──
    let cur = new Date(rangeStart);
    while (cur < TODAY) {
      if (!isWeekend(cur)) {
        const dateStr = formatDate(cur);

        if (approvedLeaveDates.has(dateStr)) {
          attendanceRows.push({
            employee_id: emp.id,
            date: dateStr,
            status: "leave",
            late_minutes: 0,
          });
        } else {
          const presence = pickWeighted([
            { value: "present", weight: 75 },
            { value: "late", weight: 18 },
            { value: "absent", weight: 7 },
          ]);

          if (presence !== "absent") {
            const isLate = presence === "late";
            const checkInHour = isLate ? randomInt(8, 9) : 7;
            const checkInMinute = isLate ? randomInt(1, 59) : randomInt(45, 59);
            const checkInTime = `${String(checkInHour).padStart(
              2,
              "0"
            )}:${String(checkInMinute).padStart(2, "0")}`;
            const lateMinutes = isLate
              ? Math.max(0, checkInHour * 60 + checkInMinute - 8 * 60)
              : 0;

            const workMinutes = randomInt(470, 560);
            const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
            const checkOutTotalMinutes = checkInTotalMinutes + workMinutes;
            const checkOutHour = Math.floor(checkOutTotalMinutes / 60);
            const checkOutMinute = checkOutTotalMinutes % 60;
            const checkOutTime = `${String(checkOutHour).padStart(
              2,
              "0"
            )}:${String(checkOutMinute).padStart(2, "0")}`;

            attendanceRows.push({
              employee_id: emp.id,
              date: dateStr,
              check_in: toTimestamp(dateStr, checkInTime),
              check_out: toTimestamp(dateStr, checkOutTime),
              status: isLate ? "late" : "present",
              late_minutes: lateMinutes,
              work_minutes: workMinutes,
            });

            // ── 3. Kadang tambahkan overtime di hari itu (~12% dari hari hadir) ──
            if (Math.random() < 0.12) {
              const otStartHour = checkOutHour;
              const otDurationHours = randomInt(1, 3);
              const otEndHour = Math.min(23, otStartHour + otDurationHours);
              const otStatus = pickWeighted([
                { value: "approved", weight: 65 },
                { value: "rejected", weight: 10 },
                { value: "manager_approved", weight: 10 },
                { value: "pending", weight: 15 },
              ]);

              overtimeRows.push({
                employee_id: emp.id,
                date: dateStr,
                start_time: `${String(otStartHour).padStart(2, "0")}:00`,
                end_time: `${String(otEndHour).padStart(2, "0")}:00`,
                total_hours: otEndHour - otStartHour,
                reason: pickWeighted([
                  { value: "Maintenance server", weight: 2 },
                  { value: "Deadline project", weight: 3 },
                  { value: "Tutup buku bulanan", weight: 1 },
                  { value: "Persiapan meeting", weight: 1 },
                ]),
                status: otStatus,
                rejection_reason:
                  otStatus === "rejected"
                    ? "Tidak ada persetujuan sebelumnya"
                    : null,
              });
            }
          }
          // kalau "absent", sengaja tidak insert apa-apa (tidak ada record attendance)
        }
      }
      cur = addDays(cur, 1);
    }
  }

  // ── Insert secara batch ──
  console.log(
    `Menyiapkan insert: ${attendanceRows.length} attendance, ${leaveRows.length} leave, ${overtimeRows.length} overtime`
  );

  await insertBatched("attendance", attendanceRows);
  await insertBatched("leave_requests", leaveRows);
  await insertBatched("overtime_requests", overtimeRows);

  // ── Update leave_balances.used_days sesuai leave yang approved ──
  console.log("Memperbarui leave_balances...");
  const year = TODAY.getFullYear();
  for (const [key, days] of balanceUpdates.entries()) {
    const [employeeId, leaveTypeId] = key.split("|");

    const { data: existing } = await supabase
      .from("leave_balances")
      .select("id, used_days")
      .eq("employee_id", employeeId)
      .eq("leave_type_id", leaveTypeId)
      .eq("year", year)
      .single();

    if (existing) {
      await supabase
        .from("leave_balances")
        .update({ used_days: existing.used_days + days })
        .eq("id", existing.id);
    }
  }

  console.log("\n✓ Selesai men-generate data historis 3 bulan.");
}

async function insertBatched(table: string, rows: any[], batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(
        `Gagal insert ke ${table} (batch ${i / batchSize + 1}):`,
        error.message
      );
    } else {
      console.log(
        `  ${table}: inserted ${Math.min(i + batchSize, rows.length)}/${
          rows.length
        }`
      );
    }
  }
}

main();
