import { describe, it, expect } from "vitest";
import { countBusinessDays } from "./leave-date";

describe("countBusinessDays", () => {
  it("menghitung hari kerja dalam satu minggu penuh (Senin-Jumat)", () => {
    // 2026-09-21 Senin s.d 2026-09-25 Jumat
    expect(countBusinessDays("2026-09-21", "2026-09-25")).toBe(5);
  });

  it("mengecualikan Sabtu dan Minggu", () => {
    // 2026-09-19 Sabtu s.d 2026-09-20 Minggu
    expect(countBusinessDays("2026-09-19", "2026-09-20")).toBe(0);
  });

  it("menghitung rentang yang melewati weekend", () => {
    // 2026-09-18 Jumat s.d 2026-09-21 Senin (melewati sabtu-minggu)
    expect(countBusinessDays("2026-09-18", "2026-09-21")).toBe(2);
  });

  it("satu hari kerja tunggal (bukan weekend) menghasilkan 1", () => {
    expect(countBusinessDays("2026-09-21", "2026-09-21")).toBe(1);
  });

  it("satu hari weekend tunggal menghasilkan 0", () => {
    expect(countBusinessDays("2026-09-19", "2026-09-19")).toBe(0);
  });
});
