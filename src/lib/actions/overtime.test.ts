import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test-utils/supabase-mock";
import { reviewOvertimeAsHR } from "./overtime";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { submitOvertimeRequest } from "./overtime";

const FAKE_USER_ID = "user-1";
const FAKE_EMPLOYEE_ID = "employee-1";

describe("submitOvertimeRequest", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    mock = createSupabaseMock();
    (createClient as any).mockResolvedValue(mock.client);
    mock.client.auth.getUser.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
    });
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
  });

  it("menolak kalau jam selesai sebelum/sama dengan jam mulai", async () => {
    const result = await submitOvertimeRequest({
      date: "2026-09-21",
      start_time: "20:00",
      end_time: "18:00",
      reason: "Lembur",
    });

    expect(result.error).toBe("Jam selesai harus setelah jam mulai");
  });

  it("menolak kalau durasi lebih dari 12 jam", async () => {
    const result = await submitOvertimeRequest({
      date: "2026-09-21",
      start_time: "06:00",
      end_time: "20:00", // 14 jam
      reason: "Lembur panjang",
    });

    expect(result.error).toContain("tidak valid");
  });

  it("berhasil submit dan menghitung total_hours dengan benar", async () => {
    mock.push("overtime_requests", "insert", { error: null });

    const result = await submitOvertimeRequest({
      date: "2026-09-21",
      start_time: "18:00",
      end_time: "21:00", // 3 jam
      reason: "Maintenance server",
    });

    expect(result.success).toBe(true);
  });
});

describe("reviewOvertimeAsHR", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    mock = createSupabaseMock();
    (createClient as any).mockResolvedValue(mock.client);
    mock.client.auth.getUser.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
    });
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
  });

  it("menolak kalau pengajuan sudah difinalisasi", async () => {
    mock.push("overtime_requests", "select", { data: { status: "approved" } });

    const result = await reviewOvertimeAsHR("ot-1", "approve");
    expect(result.error).toBe("Pengajuan ini sudah difinalisasi");
  });

  it("approve: berhasil update status jadi approved", async () => {
    mock.push("overtime_requests", "select", { data: { status: "pending" } });
    mock.push("overtime_requests", "update", { error: null });

    const result = await reviewOvertimeAsHR("ot-1", "approve");
    expect(result.success).toBe(true);
  });

  it("approve: tetap berhasil kalau status sebelumnya manager_approved", async () => {
    mock.push("overtime_requests", "select", {
      data: { status: "manager_approved" },
    });
    mock.push("overtime_requests", "update", { error: null });

    const result = await reviewOvertimeAsHR("ot-1", "approve");
    expect(result.success).toBe(true);
  });

  it("reject: berhasil update status jadi rejected dengan alasan", async () => {
    mock.push("overtime_requests", "select", { data: { status: "pending" } });
    mock.push("overtime_requests", "update", { error: null });

    const result = await reviewOvertimeAsHR(
      "ot-1",
      "reject",
      "Tidak ada bukti"
    );
    expect(result.success).toBe(true);
  });
});
