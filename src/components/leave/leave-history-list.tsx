"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

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

interface LeaveRow {
  id: string;
  full_name: string;
  type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  rejection_reason: string | null;
}

const statusLabel: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
};

export function LeaveHistoryList({ rows }: { rows: LeaveRow[] }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? rows.filter(
          (r) =>
            r.full_name.toLowerCase().includes(query) ||
            r.type_name.toLowerCase().includes(query)
        )
      : rows;

    return [...base].sort((a, b) => {
      const result = a.full_name.localeCompare(b.full_name);
      return sortDir === "asc" ? result : -result;
    });
  }, [rows, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search employee or type..."
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
                  onClick={toggleSort}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Employee
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {search ? "Tidak ada yang cocok." : "Belum ada riwayat."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>{row.type_name}</TableCell>
                  <TableCell>
                    {new Date(row.start_date).toLocaleDateString("id-ID")} –{" "}
                    {new Date(row.end_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{row.total_days}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>
                      {statusLabel[row.status]}
                    </Badge>
                    {row.status === "rejected" && row.rejection_reason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.rejection_reason}
                      </p>
                    )}
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
    </div>
  );
}
