export interface CalcInput {
  basicSalary: number;
  approvedOvertimeHours: number;
  lateCount: number;
  absentCount: number;
  workingDaysInMonth: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; calculationType: string; amount: number }[];
}

const STANDARD_WORK_HOURS_PER_MONTH = 173;
const OVERTIME_MULTIPLIER = 1.5;

export function calculatePayroll(input: CalcInput) {
  const hourlyRate = input.basicSalary / STANDARD_WORK_HOURS_PER_MONTH;
  const overtimePay = Math.round(
    hourlyRate * OVERTIME_MULTIPLIER * input.approvedOvertimeHours
  );

  const totalAllowance = input.allowances.reduce((sum, a) => sum + a.amount, 0);
  const grossSalary = input.basicSalary + totalAllowance + overtimePay;

  const dailyRate =
    input.workingDaysInMonth > 0
      ? input.basicSalary / input.workingDaysInMonth
      : 0;

  // Komponen deduction dari salary_components (BPJS, PPh21, Potongan Telat, dll)
  const deductionItems = input.deductions.map((d) => {
    let amount = 0;

    if (d.calculationType === "percentage_of_basic") {
      amount = Math.round((input.basicSalary * d.amount) / 100);
    } else if (d.calculationType === "percentage_of_daily") {
      // Rate % dari gaji harian, dikali jumlah kejadian telat
      const perOccurrence = Math.round((dailyRate * d.amount) / 100);
      amount = perOccurrence * input.lateCount;
    } else {
      amount = d.amount; // fixed
    }

    return { name: d.name, amount };
  });

  // Potongan tidak hadir — proporsional dari gaji harian, dihitung terpisah (bukan dari salary_components)
  if (input.absentCount > 0 && dailyRate > 0) {
    deductionItems.push({
      name: "Potongan Tidak Hadir",
      amount: Math.round(dailyRate * input.absentCount),
    });
  }

  // Hilangkan item dengan amount 0 (misal "Potongan Telat" tapi lateCount = 0)
  const finalDeductionItems = deductionItems.filter((d) => d.amount > 0);

  const totalDeduction = finalDeductionItems.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const netSalary = grossSalary - totalDeduction;

  return {
    hourlyRate,
    dailyRate,
    overtimePay,
    totalAllowance,
    grossSalary,
    deductionItems: finalDeductionItems,
    totalDeduction,
    netSalary,
  };
}
