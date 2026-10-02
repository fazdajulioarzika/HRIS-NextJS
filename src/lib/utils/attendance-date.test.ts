import { describe, it, expect } from "vitest";
import { getMonthRange, getJakartaDateString } from "./attendance-date";

describe("getMonthRange", () => {
  it("menghasilkan awal dan akhir bulan untuk bulan 30 hari (September)", () => {
    const { start, end } = getMonthRange("2026-09");
    expect(start).toBe("2026-09-01");
    expect(end).toBe("2026-09-30");
  });

  it("menghasilkan awal dan akhir bulan untuk bulan 31 hari (Agustus)", () => {
    const { start, end } = getMonthRange("2026-08");
    expect(start).toBe("2026-08-01");
    expect(end).toBe("2026-08-31");
  });

  it("menghasilkan akhir Februari yang benar di tahun kabisat", () => {
    const { end } = getMonthRange("2028-02"); // 2028 kabisat
    expect(end).toBe("2028-02-29");
  });

  it("menghasilkan akhir Februari yang benar di tahun non-kabisat", () => {
    const { end } = getMonthRange("2026-02");
    expect(end).toBe("2026-02-28");
  });
});

describe("getJakartaDateString", () => {
  it("mengembalikan format YYYY-MM-DD", () => {
    const result = getJakartaDateString(new Date("2026-09-15T12:00:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
