"use client";
import { useEffect, useMemo, useState, startTransition } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UserX,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deactivateEmployee } from "@/lib/actions/employees";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EmployeeFormDialog } from "./employee-form-dialog";
import type {
  DepartmentOption,
  EmployeeRow,
  ManagerOption,
  PositionOption,
} from "./types";
import type { EmployeeStatus } from "@/lib/validations/employee";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statusVariant: Record<
  EmployeeStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  probation: "secondary",
  contract: "secondary",
  permanent: "default",
  resigned: "outline",
  terminated: "destructive",
};

const statusLabel: Record<EmployeeStatus, string> = {
  active: "Active",
  probation: "Probation",
  contract: "Contract",
  permanent: "Permanent",
  resigned: "Resigned",
  terminated: "Terminated",
};

export function EmployeeTable({
  initialEmployees,
  departments,
  positions,
  managers,
}: {
  initialEmployees: EmployeeRow[];
  departments: DepartmentOption[];
  positions: PositionOption[];
  managers: ManagerOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "department">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deactivateTarget, setDeactivateTarget] = useState<EmployeeRow | null>(
    null
  );
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const sortedEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = query
      ? initialEmployees.filter((emp) => {
          const name = emp.profiles?.full_name?.toLowerCase() ?? "";
          const email = emp.profiles?.email?.toLowerCase() ?? "";
          const dept = emp.departments?.name?.toLowerCase() ?? "";
          const pos = emp.positions?.name?.toLowerCase() ?? "";
          return (
            name.includes(query) ||
            email.includes(query) ||
            dept.includes(query) ||
            pos.includes(query) ||
            emp.nik.toLowerCase().includes(query)
          );
        })
      : initialEmployees;

    return [...filtered].sort((a, b) => {
      const valueA =
        sortBy === "name"
          ? a.profiles?.full_name ?? ""
          : a.departments?.name ?? "";
      const valueB =
        sortBy === "name"
          ? b.profiles?.full_name ?? ""
          : b.departments?.name ?? "";

      const result = valueA.localeCompare(valueB);
      return sortDir === "asc" ? result : -result;
    });
  }, [initialEmployees, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / pageSize));

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, page]);

  function toggleSort(column: "name" | "department") {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(emp: EmployeeRow) {
    setEditing(emp);
    setFormOpen(true);
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  function handleDeactivate(status: "resigned" | "terminated") {
    if (!deactivateTarget) return;
    setDeactivateError(null);
    setIsDeactivating(true);
    startTransition(async () => {
      const result = await deactivateEmployee(deactivateTarget.id, status);
      setIsDeactivating(false);
      if (result.error) {
        setDeactivateError(result.error);
        return;
      }
      setDeactivateTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button
          onClick={openCreate}
          disabled={departments.length === 0 || positions.length === 0}
        >
          <Plus className="size-4" />
          Add Employee
        </Button>
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
                  Name
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
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {search
                    ? "Tidak ada karyawan yang cocok."
                    : "Belum ada karyawan."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={emp.photo_url ?? ""} />
                        <AvatarFallback>
                          {initials(emp.profiles?.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="font-medium hover:underline"
                          >
                            {emp.profiles?.full_name ?? "-"}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {emp.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.departments?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.positions?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[emp.employment_status]}>
                      {statusLabel[emp.employment_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(emp)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeactivateTarget(emp)}
                        >
                          <UserX className="size-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-3">
        <p className="text-sm text-muted-foreground">
          {sortedEmployees.length === 0
            ? "0 results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                sortedEmployees.length
              )} of ${sortedEmployees.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        departments={departments}
        positions={positions}
        managers={managers}
      />
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent className="min-w-md sm:min-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate employee?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.profiles?.full_name} akan ditandai tidak aktif.
              Data historis (attendance, cuti, payroll) tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deactivateError && (
            <p className="text-sm text-destructive">{deactivateError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDeactivate("resigned")}
              disabled={isDeactivating}
            >
              Mark as Resigned
            </Button>
            <AlertDialogAction
              onClick={() => handleDeactivate("terminated")}
              disabled={isDeactivating}
            >
              Mark as Terminated
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
