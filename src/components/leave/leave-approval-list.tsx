"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { reviewLeaveAsManager, reviewLeaveAsHR } from "@/lib/actions/leave";

interface LeaveRow {
  id: string;
  full_name: string;
  type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
}

type SortBy = "name" | "date";

export function LeaveApprovalList({
  rows,
  role,
}: {
  rows: LeaveRow[];
  role: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<LeaveRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? rows.filter(
          (r) =>
            r.full_name.toLowerCase().includes(query) ||
            r.type_name.toLowerCase().includes(query) ||
            r.reason.toLowerCase().includes(query)
        )
      : rows;

    return [...base].sort((a, b) => {
      const result =
        sortBy === "name"
          ? a.full_name.localeCompare(b.full_name)
          : a.start_date.localeCompare(b.start_date);
      return sortDir === "asc" ? result : -result;
    });
  }, [rows, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  function toggleSort(column: SortBy) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const fn = role === "hr" ? reviewLeaveAsHR : reviewLeaveAsManager;
      await fn(id, "approve");
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    startTransition(async () => {
      const fn = role === "hr" ? reviewLeaveAsHR : reviewLeaveAsManager;
      await fn(rejectTarget.id, "reject", rejectReason);
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search employee, type, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Employee
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("date")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Dates
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              {role === "hr" && <TableHead>Status</TableHead>}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={role === "hr" ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  {search ? "Tidak ada yang cocok." : "Tidak ada pengajuan."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>{row.type_name}</TableCell>
                  <TableCell>
                    {new Date(row.start_date).toLocaleDateString("id-ID")} –{" "}
                    {new Date(row.end_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{row.total_days}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {row.reason}
                  </TableCell>
                  {role === "hr" && (
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "manager_approved"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {row.status === "manager_approved"
                          ? "Manager OK"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleApprove(row.id)}
                        disabled={isPending}
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setRejectTarget(row)}
                        disabled={isPending}
                      >
                        <X className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan (opsional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
