import { describe, it, expect } from "vitest";
import { departmentSchema, positionSchema } from "./organization";

describe("departmentSchema", () => {
  it("menerima nama valid dengan deskripsi opsional", () => {
    const result = departmentSchema.safeParse({
      name: "Information Technology",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("menolak nama terlalu pendek", () => {
    const result = departmentSchema.safeParse({ name: "A", description: "" });
    expect(result.success).toBe(false);
  });
});
describe("positionSchema", () => {
  it("mewajibkan department_id berupa UUID valid", () => {
    const result = positionSchema.safeParse({
      name: "Backend Developer",
      department_id: "bukan-uuid",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("menerima data valid lengkap", () => {
    const result = positionSchema.safeParse({
      name: "Backend Developer",
      department_id: "11111111-1111-4111-8111-111111111111",
      description: "",
    });
    expect(result.success).toBe(true);
  });
});
