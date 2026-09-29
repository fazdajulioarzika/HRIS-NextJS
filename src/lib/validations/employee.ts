import { z } from "zod";

export const employeeStatusValues = [
  "active",
  "probation",
  "contract",
  "permanent",
  "resigned",
  "terminated",
] as const;
export type EmployeeStatus = (typeof employeeStatusValues)[number];

const baseFields = {
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  nik: z.string().trim().min(1, "NIK wajib diisi").max(32),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  join_date: z.string().min(1, "Tanggal masuk wajib diisi"),
  department_id: z.string().uuid({ message: "Pilih departemen" }),
  position_id: z.string().uuid({ message: "Pilih posisi" }),
  manager_id: z.string().uuid().nullable().optional(),
  basic_salary: z.coerce.number().min(0, "Gaji tidak boleh negatif"),
  employment_status: z.enum(employeeStatusValues),
};

export const createEmployeeSchema = z.object({
  ...baseFields,
  email: z.string().trim().email("Email tidak valid"),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object(baseFields);
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
