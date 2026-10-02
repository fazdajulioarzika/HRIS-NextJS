import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { PayslipDocument } from "@/lib/pdf/payslip-document";

function getName(rel: any, path: string[]): string {
  let cur = Array.isArray(rel) ? rel[0] : rel;
  for (const key of path) {
    if (!cur) return "-";
    cur = Array.isArray(cur[key]) ? cur[key][0] : cur[key];
  }
  return cur ?? "-";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const { payrollId } = await params;
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: payroll } = await supabase
    .from("payrolls")
    .select(
      `id, basic_salary, total_allowance, total_overtime, total_bonus, gross_salary, total_deduction, net_salary,
     payroll_periods ( name, status ),
     employees ( profiles ( full_name ), departments ( name ), positions ( name ) )`
    )
    .eq("id", payrollId)
    .single();

  if (!payroll)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // RLS (employee_select_own_payroll) sudah membatasi akses, tapi cek eksplisit juga status periode
  const periodStatus = getName(payroll.payroll_periods, ["status"]);
  if (periodStatus !== "approved" && periodStatus !== "paid") {
    return NextResponse.json({ error: "Payslip belum final" }, { status: 403 });
  }

  const { data: items } = await supabase
    .from("payroll_items")
    .select("component_name, type, amount")
    .eq("payroll_id", payrollId);

  const allowanceItems = (items ?? [])
    .filter((i) => i.type === "allowance")
    .map((i) => ({ name: i.component_name, amount: i.amount }));

  const deductionItems = (items ?? [])
    .filter((i) => i.type === "deduction")
    .map((i) => ({ name: i.component_name, amount: i.amount }));

  const pdfBuffer = await renderToBuffer(
    PayslipDocument({
      data: {
        companyName: "PT Arzikadev Indonesia",
        periodName: getName(payroll.payroll_periods, ["name"]),
        employeeName: getName(payroll.employees, ["profiles", "full_name"]),
        position: getName(payroll.employees, ["positions", "name"]),
        department: getName(payroll.employees, ["departments", "name"]),
        basicSalary: payroll.basic_salary,
        allowanceItems,
        overtimeAmount: payroll.total_overtime,
        bonusAmount: payroll.total_bonus,
        deductionItems,
        grossSalary: payroll.gross_salary,
        totalDeduction: payroll.total_deduction,
        netSalary: payroll.net_salary,
      },
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="slip-gaji-${periodStatus}.pdf"`,
    },
  });
}
