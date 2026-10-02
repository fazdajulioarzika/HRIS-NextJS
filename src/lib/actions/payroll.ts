"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculatePayroll } from "@/lib/utils/payroll-calc";

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

export async function createPayrollPeriod(input: {
  month: number;
  year: number;
}) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const name = `${monthNames[input.month - 1]} ${input.year}`;

  const { data, error } = await auth.supabase
    .from("payroll_periods")
    .insert({ name, month: input.month, year: input.year })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "Periode ini sudah ada" : error.message,
    };
  }

  revalidatePath("/payroll");
  return { success: true, periodId: data.id };
}

export async function generatePayroll(periodId: string) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { data: period } = await auth.supabase
    .from("payroll_periods")
    .select("month, year, status")
    .eq("id", periodId)
    .single();

  if (!period) return { error: "Periode tidak ditemukan" };
  if (period.status !== "draft")
    return { error: "Periode ini sudah pernah di-generate" };

  const { data: employees } = await auth.supabase
    .from("employees")
    .select("id, basic_salary")
    .in("employment_status", ["active", "permanent", "contract", "probation"]);

  const { data: components } = await auth.supabase
    .from("salary_components")
    .select("name, type, calculation_type, default_amount")
    .eq("is_active", true)
    .neq("name", "Potongan Tidak Hadir");

  const allowanceComponents = (components ?? []).filter(
    (c) => c.type === "allowance"
  );
  const deductionComponents = (components ?? []).filter(
    (c) => c.type === "deduction"
  );

  const monthStr = String(period.month).padStart(2, "0");
  const periodStart = `${period.year}-${monthStr}-01`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const periodEnd = `${period.year}-${monthStr}-${String(lastDay).padStart(
    2,
    "0"
  )}`;

  let workingDaysInMonth = 0;
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(period.year, period.month - 1, d).getDay();
    if (day !== 0 && day !== 6) workingDaysInMonth++;
  }

  let created = 0;

  for (const emp of employees ?? []) {
    const { data: overtimeRequests } = await auth.supabase
      .from("overtime_requests")
      .select("total_hours")
      .eq("employee_id", emp.id)
      .eq("status", "approved")
      .gte("date", periodStart)
      .lte("date", periodEnd);

    const approvedOvertimeHours = (overtimeRequests ?? []).reduce(
      (sum, o) => sum + Number(o.total_hours),
      0
    );

    const { data: attendanceRecords } = await auth.supabase
      .from("attendance")
      .select("status")
      .eq("employee_id", emp.id)
      .gte("date", periodStart)
      .lte("date", periodEnd);

    const lateCount = (attendanceRecords ?? []).filter(
      (a) => a.status === "late"
    ).length;

    // Hari absen = hari kerja - hari yang punya record attendance (present/late/leave/dll)
    const daysWithRecord = (attendanceRecords ?? []).length;
    const absentCount = Math.max(0, workingDaysInMonth - daysWithRecord);

    const allowances = allowanceComponents.map((c) => ({
      name: c.name,
      amount: c.default_amount,
    }));
    const deductions = deductionComponents.map((c) => ({
      name: c.name,
      calculationType: c.calculation_type,
      amount: c.default_amount,
    }));

    const calc = calculatePayroll({
      basicSalary: Number(emp.basic_salary),
      approvedOvertimeHours,
      lateCount,
      absentCount,
      workingDaysInMonth,
      allowances,
      deductions,
    });

    const { data: payroll, error: payrollError } = await auth.supabase
      .from("payrolls")
      .insert({
        payroll_period_id: periodId,
        employee_id: emp.id,
        basic_salary: emp.basic_salary,
        total_allowance: calc.totalAllowance,
        total_overtime: calc.overtimePay,
        total_bonus: 0,
        gross_salary: calc.grossSalary,
        total_deduction: calc.totalDeduction,
        net_salary: calc.netSalary,
      })
      .select("id")
      .single();

    if (payrollError || !payroll) continue;

    const items = [
      ...allowances.map((a) => ({
        payroll_id: payroll.id,
        component_name: a.name,
        type: "allowance",
        amount: a.amount,
      })),
      ...(calc.overtimePay > 0
        ? [
            {
              payroll_id: payroll.id,
              component_name: "Lembur",
              type: "overtime",
              amount: calc.overtimePay,
            },
          ]
        : []),
      ...calc.deductionItems.map((d) => ({
        payroll_id: payroll.id,
        component_name: d.name,
        type: "deduction",
        amount: d.amount,
      })),
    ];

    if (items.length > 0) {
      await auth.supabase.from("payroll_items").insert(items);
    }

    created++;
  }

  await auth.supabase
    .from("payroll_periods")
    .update({ status: "calculated" })
    .eq("id", periodId);

  revalidatePath(`/payroll/${periodId}`);
  revalidatePath("/payroll");
  return { success: true, count: created };
}

export async function updatePeriodStatus(
  periodId: string,
  status: "reviewed" | "approved" | "paid"
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("payroll_periods")
    .update({ status })
    .eq("id", periodId);
  if (error) return { error: error.message };

  revalidatePath(`/payroll/${periodId}`);
  revalidatePath("/payroll");
  return { success: true };
}

export async function updatePayrollManual(
  payrollId: string,
  input: {
    basicSalary: number;
    bonus: number;
    allowanceItems: { name: string; amount: number }[];
    overtimeAmount: number;
    deductionItems: { name: string; amount: number }[];
  }
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const totalAllowance = input.allowanceItems.reduce(
    (sum, a) => sum + a.amount,
    0
  );
  const totalDeduction = input.deductionItems.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const grossSalary =
    input.basicSalary + totalAllowance + input.overtimeAmount + input.bonus;
  const netSalary = grossSalary - totalDeduction;

  const { error: payrollError } = await auth.supabase
    .from("payrolls")
    .update({
      basic_salary: input.basicSalary,
      total_allowance: totalAllowance,
      total_overtime: input.overtimeAmount,
      total_bonus: input.bonus,
      gross_salary: grossSalary,
      total_deduction: totalDeduction,
      net_salary: netSalary,
    })
    .eq("id", payrollId);

  if (payrollError) return { error: payrollError.message };

  // Hapus item lama, insert ulang sesuai input terbaru
  await auth.supabase
    .from("payroll_items")
    .delete()
    .eq("payroll_id", payrollId);

  const items = [
    ...input.allowanceItems.map((a) => ({
      payroll_id: payrollId,
      component_name: a.name,
      type: "allowance",
      amount: a.amount,
    })),
    ...(input.overtimeAmount > 0
      ? [
          {
            payroll_id: payrollId,
            component_name: "Lembur",
            type: "overtime",
            amount: input.overtimeAmount,
          },
        ]
      : []),
    ...(input.bonus > 0
      ? [
          {
            payroll_id: payrollId,
            component_name: "Bonus",
            type: "bonus",
            amount: input.bonus,
          },
        ]
      : []),
    ...input.deductionItems.map((d) => ({
      payroll_id: payrollId,
      component_name: d.name,
      type: "deduction",
      amount: d.amount,
    })),
  ];

  if (items.length > 0) {
    const { error: itemsError } = await auth.supabase
      .from("payroll_items")
      .insert(items);
    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath(`/payroll`);
  return { success: true };
}

export async function getPayrollDetail(payrollId: string) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { data: payroll } = await auth.supabase
    .from("payrolls")
    .select("id, basic_salary, total_overtime, total_bonus, payroll_period_id")
    .eq("id", payrollId)
    .single();

  if (!payroll) return { error: "Payroll tidak ditemukan" };

  const { data: items } = await auth.supabase
    .from("payroll_items")
    .select("component_name, type, amount")
    .eq("payroll_id", payrollId);

  const { data: period } = await auth.supabase
    .from("payroll_periods")
    .select("status")
    .eq("id", payroll.payroll_period_id)
    .single();

  return {
    success: true,
    payroll,
    items: items ?? [],
    periodStatus: period?.status,
  };
}
