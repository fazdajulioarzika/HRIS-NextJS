import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test-utils/supabase-mock";
import { reviewLeaveAsHR } from "./leave";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { submitLeaveRequest, cancelLeaveRequest } from "./leave";

const FAKE_USER_ID = "user-1";
const FAKE_EMPLOYEE_ID = "employee-1";
const FAKE_LEAVE_TYPE_ID = "leave-type-1";

describe("submitLeaveRequest", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    mock = createSupabaseMock();
    (createClient as any).mockResolvedValue(mock.client);
    mock.client.auth.getUser.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
    });
  });

  it("menolak kalau alasan kosong", async () => {
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });

    const result = await submitLeaveRequest({
      leave_type_id: FAKE_LEAVE_TYPE_ID,
      start_date: "2026-09-21",
      end_date: "2026-09-22",
      reason: "   ", // cuma spasi
    });

    expect(result.error).toBe("Alasan wajib diisi");
  });

  it("menolak kalau saldo cuti tidak cukup", async () => {
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
    mock.push("leave_balances", "select", {
      data: { total_days: 3, used_days: 0 },
      error: null,
    });

    const result = await submitLeaveRequest({
      leave_type_id: FAKE_LEAVE_TYPE_ID,
      start_date: "2026-09-21", // Senin
      end_date: "2026-09-25", // Jumat, total 5 hari kerja
      reason: "Liburan",
    });

    expect(result.error).toContain("Sisa cuti tidak cukup");
  });

  it("menolak kalau saldo cuti belum ada sama sekali di database", async () => {
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
    mock.push("leave_balances", "select", {
      data: null,
      error: { message: "not found" },
    });

    const result = await submitLeaveRequest({
      leave_type_id: FAKE_LEAVE_TYPE_ID,
      start_date: "2026-09-21",
      end_date: "2026-09-21",
      reason: "Sakit",
    });

    expect(result.error).toBe(
      "Saldo cuti untuk jenis ini belum tersedia. Hubungi HR."
    );
  });

  it("berhasil submit kalau saldo cukup", async () => {
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
    mock.push("leave_balances", "select", {
      data: { total_days: 12, used_days: 0 },
      error: null,
    });
    mock.push("leave_requests", "insert", { error: null });

    const result = await submitLeaveRequest({
      leave_type_id: FAKE_LEAVE_TYPE_ID,
      start_date: "2026-09-21",
      end_date: "2026-09-22",
      reason: "Acara keluarga",
    });

    expect(result.success).toBe(true);
  });
});

describe("cancelLeaveRequest", () => {
  it("berhasil membatalkan pengajuan milik sendiri", async () => {
    const mock = createSupabaseMock();
    (createClient as any).mockResolvedValue(mock.client);
    mock.client.auth.getUser.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
    });

    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } });
    mock.push("leave_requests", "update", { error: null });

    const result = await cancelLeaveRequest("leave-request-1");
    expect(result.success).toBe(true);
  });
});

describe("reviewLeaveAsHR", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    mock = createSupabaseMock();
    (createClient as any).mockResolvedValue(mock.client);
    mock.client.auth.getUser.mockResolvedValue({
      data: { user: { id: FAKE_USER_ID } },
    });
    mock.push("employees", "select", { data: { id: FAKE_EMPLOYEE_ID } }); // untuk getMyEmployeeId
  });

  it("menolak kalau pengajuan sudah difinalisasi sebelumnya", async () => {
    mock.push("leave_requests", "select", {
      data: {
        status: "approved", // sudah final
        employee_id: "emp-2",
        leave_type_id: "lt-1",
        total_days: 2,
        start_date: "2026-09-21",
        end_date: "2026-09-22",
      },
    });

    const result = await reviewLeaveAsHR("leave-1", "approve");
    expect(result.error).toBe("Pengajuan ini sudah difinalisasi");
  });

  it("approve: update status, potong saldo, dan buat attendance 'leave' untuk hari kerja", async () => {
    mock.push("leave_requests", "select", {
      data: {
        status: "pending",
        employee_id: "emp-2",
        leave_type_id: "lt-1",
        total_days: 2,
        start_date: "2026-09-21", // Senin
        end_date: "2026-09-22", // Selasa
      },
    });
    mock.push("leave_requests", "update", { error: null });
    mock.push("leave_balances", "select", {
      data: { id: "bal-1", used_days: 0 },
    });
    mock.push("leave_balances", "update", { error: null });
    mock.push("attendance", "upsert" as any, { error: null }); // lihat catatan di bawah

    const result = await reviewLeaveAsHR("leave-1", "approve");
    expect(result.success).toBe(true);
  });

  it("reject: hanya update status, tidak menyentuh balance atau attendance", async () => {
    mock.push("leave_requests", "select", {
      data: {
        status: "manager_approved",
        employee_id: "emp-2",
        leave_type_id: "lt-1",
        total_days: 1,
        start_date: "2026-09-21",
        end_date: "2026-09-21",
      },
    });
    mock.push("leave_requests", "update", { error: null });

    const result = await reviewLeaveAsHR("leave-1", "reject", "Alasan ditolak");
    expect(result.success).toBe(true);
    // Tidak ada push untuk leave_balances/attendance — kalau kode salah mencoba
    // mengaksesnya, test ini akan gagal dengan error "Tidak ada mock response"
  });
});
