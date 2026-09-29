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

interface TeamRow {
  id: string;
  full_name: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  late_minutes: number;
}

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function TeamAttendanceTable({ rows }: { rows: TeamRow[] }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? rows.filter((r) => r.full_name.toLowerCase().includes(query))
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
          placeholder="Search team member..."
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
                  Name
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {search
                    ? "Tidak ada anggota tim yang cocok."
                    : "Belum ada anggota tim."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name}
                  </TableCell>
                  <TableCell>{formatTime(member.check_in)}</TableCell>
                  <TableCell>{formatTime(member.check_out)}</TableCell>
                  <TableCell>
                    {member.status ? (
                      <Badge
                        variant={
                          member.status === "late" ? "destructive" : "default"
                        }
                      >
                        {member.status}
                        {member.late_minutes > 0
                          ? ` (${member.late_minutes}m)`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not checked in</Badge>
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
          {filtered.length === 0
            ? "0 results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                filtered.length
              )} of ${filtered.length}`}
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
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
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
