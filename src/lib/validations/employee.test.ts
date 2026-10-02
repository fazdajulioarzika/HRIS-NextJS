import { describe, it, expect } from "vitest";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee";

const validBase = {
  full_name: "Budi Santoso",
  nik: "3201010101010001",
  phone: "08123456789",
  address: "Jl. Contoh No. 1",
  birth_date: "1990-01-01",
  join_date: "2026-01-01",
  department_id: "11111111-1111-4111-8111-111111111111",
  position_id: "22222222-2222-4222-8222-222222222222",
  manager_id: null,
  basic_salary: 5_000_000,
  employment_status: "active" as const,
};

describe("createEmployeeSchema", () => {
  it("menerima data lengkap dan valid", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "budi@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("menolak email yang tidak valid", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "bukan-email",
    });
    expect(result.success).toBe(false);
  });

  it("menolak nama kosong", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "budi@example.com",
      full_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("menolak gaji negatif", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "budi@example.com",
      basic_salary: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("menolak department_id yang bukan UUID", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "budi@example.com",
      department_id: "bukan-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("menolak status yang tidak ada dalam enum", () => {
    const result = createEmployeeSchema.safeParse({
      ...validBase,
      email: "budi@example.com",
      employment_status: "sedang-liburan",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEmployeeSchema", () => {
  it("tidak mewajibkan email (karena email tidak bisa diubah saat edit)", () => {
    const result = updateEmployeeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});
