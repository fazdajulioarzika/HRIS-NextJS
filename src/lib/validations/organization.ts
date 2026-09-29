import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const positionSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  department_id: z.string().uuid({ message: "Pilih departemen" }),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type PositionInput = z.infer<typeof positionSchema>;
