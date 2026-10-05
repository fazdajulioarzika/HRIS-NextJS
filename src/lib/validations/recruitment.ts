import { z } from "zod";

export const employmentTypeValues = [
  "full_time",
  "contract",
  "internship",
  "part_time",
] as const;
export const vacancyStatusValues = [
  "draft",
  "published",
  "closed",
  "archived",
] as const;
export const candidateStatusValues = [
  "applied",
  "screening",
  "interview",
  "technical_test",
  "offering",
  "hired",
  "rejected",
] as const;

export const vacancySchema = z.object({
  position_id: z.string().uuid({ message: "Pilih posisi" }),
  department_id: z.string().uuid({ message: "Pilih departemen" }),
  location: z.string().trim().min(2, "Lokasi wajib diisi"),
  employment_type: z.enum(employmentTypeValues),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter"),
  requirements: z.string().trim().min(10, "Requirements minimal 10 karakter"),
  deadline: z.string().optional(),
});
export type VacancyInput = z.infer<typeof vacancySchema>;

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().min(8, "Nomor telepon tidak valid"),
  source: z.string().trim().optional(),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
