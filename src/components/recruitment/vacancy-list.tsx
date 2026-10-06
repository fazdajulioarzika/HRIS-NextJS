"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Sheet,
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

import { VacancyFormDialog } from "./vacancy-form-dialog";

interface VacancyRow {
  id: string;
  position: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  deadline: string | null;
  candidateCount: number;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  closed: "secondary",
  archived: "outline",
};

type SortBy = "position" | "department" | "candidates";

export function VacancyList({
  vacancies,
  departments,
  positions,
}: {
  vacancies: VacancyRow[];
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; department_id: string }[];
}) {
  const [formOpen, setFormOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? vacancies.filter(
          (v) =>
            v.position.toLowerCase().includes(query) ||
            v.department.toLowerCase().includes(query) ||
            v.location.toLowerCase().includes(query)
        )
      : vacancies;

    return [...base].sort((a, b) => {
      let result = 0;
      if (sortBy === "position") result = a.position.localeCompare(b.position);
      else if (sortBy === "department")
        result = a.department.localeCompare(b.department);
      else if (sortBy === "candidates")
        result = a.candidateCount - b.candidateCount;

      return sortDir === "asc" ? result : -result;
    });
  }, [vacancies, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function toggleSort(column: SortBy) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search position, department, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/recruitment/email-templates">
                <Sheet className="size-4" />
                Email Templates
              </Link>
            }
          />

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New Vacancy
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("position")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Position
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("department")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Department
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("candidates")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Candidates
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  {search ? "Tidak ada yang cocok." : "Belum ada lowongan."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.position}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.department}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.location}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[v.status]}>{v.status}</Badge>
                  </TableCell>
                  <TableCell>{v.candidateCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/recruitment/${v.id}`}>View</Link>}
                    />
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

      <VacancyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        departments={departments}
        positions={positions}
      />
    </>
  );
}
