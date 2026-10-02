import { describe, it, expect } from "vitest";
import { calculatePayroll } from "./payroll-calc";

describe("calculatePayroll", () => {
  it("menghitung gross salary dari basic + allowance, tanpa overtime/late/absent", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 0,
      lateCount: 0,
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [
        { name: "Tunjangan Transport", amount: 300_000 },
        { name: "Tunjangan Makan", amount: 300_000 },
      ],
      deductions: [],
    });

    expect(result.totalAllowance).toBe(600_000);
    expect(result.grossSalary).toBe(12_600_000); // basic + allowance, overtime = 0
    expect(result.overtimePay).toBe(0);
  });

  it("menghitung overtime dengan rate 1.5x dari gaji per jam", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 10,
      lateCount: 0,
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [],
      deductions: [],
    });

    // hourlyRate = 12.000.000 / 173 = 69.364,16...
    // overtimePay = round(69.364,16 * 1.5 * 10) = round(1.040.462,4) = 1.040.462
    expect(result.overtimePay).toBe(1_040_462);
    expect(result.grossSalary).toBe(12_000_000 + 1_040_462);
  });

  it("menghitung deduction percentage_of_basic (BPJS, PPh21)", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 0,
      lateCount: 0,
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [],
      deductions: [
        { name: "BPJS", calculationType: "percentage_of_basic", amount: 1 },
        { name: "PPh 21", calculationType: "percentage_of_basic", amount: 2.5 },
      ],
    });

    expect(result.deductionItems).toEqual([
      { name: "BPJS", amount: 120_000 },
      { name: "PPh 21", amount: 300_000 },
    ]);
    expect(result.totalDeduction).toBe(420_000);
  });

  it("menghitung potongan telat sebagai percentage_of_daily × jumlah kejadian", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 0,
      lateCount: 5,
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [],
      deductions: [
        {
          name: "Potongan Telat",
          calculationType: "percentage_of_daily",
          amount: 5,
        },
      ],
    });

    // dailyRate = 12.000.000 / 22 = 545.454,54...
    // perOccurrence = round(545.454,54 * 5 / 100) = round(27.272,72) = 27.273
    // total = 27.273 * 5 = 136.365
    expect(result.totalDeduction).toBe(136_365);
  });

  it("menghitung potongan tidak hadir proporsional dari gaji harian", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 0,
      lateCount: 0,
      absentCount: 4,
      workingDaysInMonth: 22,
      allowances: [],
      deductions: [],
    });

    // dailyRate = 545.454,54..., absentCount = 4
    // potongan = round(545.454,54 * 4) = 2.181.818
    const absentDeduction = result.deductionItems.find(
      (d) => d.name === "Potongan Tidak Hadir"
    );
    expect(absentDeduction?.amount).toBe(2_181_818);
  });

  it("tidak membuat deduction item kalau amount-nya 0 (misal lateCount = 0)", () => {
    const result = calculatePayroll({
      basicSalary: 12_000_000,
      approvedOvertimeHours: 0,
      lateCount: 0, // tidak pernah telat
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [],
      deductions: [
        {
          name: "Potongan Telat",
          calculationType: "percentage_of_daily",
          amount: 5,
        },
      ],
    });

    // Karena lateCount = 0, amount-nya jadi 0, dan filter amount > 0 akan menghapusnya
    expect(result.deductionItems).toEqual([]);
    expect(result.totalDeduction).toBe(0);
  });

  it("net salary = gross - total deduction", () => {
    const result = calculatePayroll({
      basicSalary: 10_000_000,
      approvedOvertimeHours: 0,
      lateCount: 0,
      absentCount: 0,
      workingDaysInMonth: 22,
      allowances: [{ name: "Tunjangan", amount: 1_000_000 }],
      deductions: [
        { name: "BPJS", calculationType: "percentage_of_basic", amount: 1 },
      ],
    });

    expect(result.grossSalary).toBe(11_000_000);
    expect(result.totalDeduction).toBe(100_000);
    expect(result.netSalary).toBe(10_900_000);
  });
});
