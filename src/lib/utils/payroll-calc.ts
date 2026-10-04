export interface CalcInput {
  basicSalary: number;
  approvedOvertimeHours: number;
  lateCount: number;
  absentCount: number;
  workingDaysInMonth: number;
  allowances: { name: string; calculationType: string; amount: number }[];
  deductions: { name: string; calculationType: string; amount: number }[];
}

const STANDARD_WORK_HOURS_PER_MONTH = 173;
const OVERTIME_MULTIPLIER = 1.5;

export function calculatePayroll(input: CalcInput) {
  const hourlyRate = input.basicSalary / STANDARD_WORK_HOURS_PER_MONTH;
  const overtimePay = Math.round(
    hourlyRate * OVERTIME_MULTIPLIER * input.approvedOvertimeHours
  );

  const dailyRate =
    input.workingDaysInMonth > 0
      ? input.basicSalary / input.workingDaysInMonth
      : 0;

  const allowanceItems = input.allowances
    .map((a) => {
      const amount =
        a.calculationType === "percentage_of_basic"
          ? Math.round((input.basicSalary * a.amount) / 100)
          : a.amount;
      return { name: a.name, amount };
    })
    .filter((a) => a.amount > 0);

  const totalAllowance = allowanceItems.reduce((sum, a) => sum + a.amount, 0);
  const grossSalary = input.basicSalary + totalAllowance + overtimePay;

  const deductionItems = input.deductions
    .map((d) => {
      let amount = 0;

      if (d.calculationType === "percentage_of_basic") {
        amount = Math.round((input.basicSalary * d.amount) / 100);
      } else if (d.calculationType === "percentage_of_daily") {
        const perOccurrence = Math.round((dailyRate * d.amount) / 100);
        amount = perOccurrence * input.lateCount;
      } else if (d.calculationType === "percentage_of_daily_absent") {
        const perDay = Math.round((dailyRate * d.amount) / 100);
        amount = perDay * input.absentCount;
      } else {
        amount = d.amount;
      }

      return { name: d.name, amount };
    })
    .filter((d) => d.amount > 0);

  const totalDeduction = deductionItems.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = grossSalary - totalDeduction;

  return {
    hourlyRate,
    dailyRate,
    overtimePay,
    totalAllowance,
    allowanceItems,
    grossSalary,
    deductionItems,
    totalDeduction,
    netSalary,
  };
}
