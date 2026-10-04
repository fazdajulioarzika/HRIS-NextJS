import { z } from "zod";

export const salaryComponentTypeValues = ["allowance", "deduction"] as const;
export const calculationTypeValues = [
  "fixed",
  "percentage_of_basic",
  "percentage_of_daily",
  "percentage_of_daily_absent",
] as const;
export const salaryComponentSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  type: z.enum(salaryComponentTypeValues),
  calculation_type: z.enum(calculationTypeValues),
  default_amount: z.coerce.number().min(0, "Tidak boleh negatif"),
  is_active: z.boolean(),
});

export type SalaryComponentInput = z.infer<typeof salaryComponentSchema>;
