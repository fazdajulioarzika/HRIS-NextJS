"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { PayrollItemEditDialog } from "./payroll-item-edit-dialog";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Search,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { generatePayroll, updatePeriodStatus } from "@/lib/actions/payroll";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface PayrollRow {
  id: string;
  full_name: string;
  basic_salary: number;
  total_allowance: number;
  total_overtime: number;
  gross_salary: number;
  total_deduction: number;
  net_salary: number;
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  calculated: "Calculated",
  reviewed: "Reviewed",
  approved: "Approved",
  paid: "Paid",
};

export function PayrollPeriodDetail({
  period,
  rows,
}: {
  period: { id: string; name: string; status: string };
  rows: PayrollRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? rows.filter((r) => r.full_name.toLowerCase().includes(query))
      : rows;

    return [...base].sort((a, b) => {
      const result = a.full_name.localeCompare(b.full_name);
      return sortDir === "asc" ? result : -result;
    });
  }, [rows, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function handleGenerate() {
    startTransition(async () => {
      await generatePayroll(period.id);
      router.refresh();
    });
  }

  function handleAdvanceStatus(status: "reviewed" | "approved" | "paid") {
    startTransition(async () => {
      await updatePeriodStatus(period.id, status);
      router.refresh();
    });
  }

  const totalNet = rows.reduce((sum, r) => sum + r.net_salary, 0);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{period.name}</h1>
          <Badge className="mt-1">{statusLabel[period.status]}</Badge>
        </div>

        <div className="flex gap-2">
          {period.status === "draft" && (
            <Button onClick={handleGenerate} disabled={isPending}>
              <Play className="size-4" />
              {isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          )}
          {period.status === "calculated" && (
            <Button
              onClick={() => handleAdvanceStatus("reviewed")}
              disabled={isPending}
            >
              Mark as Reviewed
            </Button>
          )}
          {period.status === "reviewed" && (
            <Button
              onClick={() => handleAdvanceStatus("approved")}
              disabled={isPending}
            >
              Approve
            </Button>
          )}
          {period.status === "approved" && (
            <Button
              onClick={() => handleAdvanceStatus("paid")}
              disabled={isPending}
            >
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Total Net Salary:{" "}
          <span className="font-semibold text-foreground">
            {formatRupiah(totalNet)}
          </span>{" "}
          untuk {rows.length} karyawan
        </p>
      )}

      {rows.length > 0 && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={toggleSort}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Employee
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Basic</TableHead>
              <TableHead>Allowance</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Deduction</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  {rows.length === 0
                    ? 'Belum di-generate. Klik "Generate Payroll".'
                    : "Tidak ada yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{formatRupiah(r.basic_salary)}</TableCell>
                  <TableCell>{formatRupiah(r.total_allowance)}</TableCell>
                  <TableCell>{formatRupiah(r.total_overtime)}</TableCell>
                  <TableCell>{formatRupiah(r.gross_salary)}</TableCell>
                  <TableCell className="text-destructive">
                    -{formatRupiah(r.total_deduction)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatRupiah(r.net_salary)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditTarget({ id: r.id, name: r.full_name })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      {editTarget && (
        <PayrollItemEditDialog
          payrollId={editTarget.id}
          employeeName={editTarget.name}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </div>
  );
}
