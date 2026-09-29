"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function DailyReport({ data }: { data: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", e.target.value);
    router.push(`/attendance/report?${params.toString()}`);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? data.rows.filter(
          (r: any) =>
            r.full_name.toLowerCase().includes(query) ||
            r.department.toLowerCase().includes(query) ||
            r.position.toLowerCase().includes(query)
        )
      : data.rows;

    return [...base].sort((a: any, b: any) => {
      const result = a.full_name.localeCompare(b.full_name);
      return sortDir === "asc" ? result : -result;
    });
  }, [data.rows, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{data.summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {data.summary.present}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.summary.late}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                {data.isPastDate ? "Absent" : "Not Checked In"}
              </p>
              <p className="text-2xl font-bold text-destructive">
                {data.isPastDate ? data.summary.absent : data.summary.notYet}
              </p>
            </CardContent>
          </Card>
        </div>

        <Input
          type="date"
          value={data.selectedDate}
          onChange={handleDateChange}
          className="w-auto"
        />
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search employee..."
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
                  onClick={() =>
                    setSortDir((p) => (p === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Name
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
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
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.department}
                  </TableCell>
                  <TableCell>{formatTime(r.check_in)}</TableCell>
                  <TableCell>{formatTime(r.check_out)}</TableCell>
                  <TableCell>
                    {r.status ? (
                      <Badge
                        variant={
                          r.status === "late" ? "destructive" : "default"
                        }
                      >
                        {r.status}
                        {r.late_minutes > 0 ? ` (${r.late_minutes}m)` : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {data.isPastDate ? "Absent" : "Not checked in"}
                      </Badge>
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
