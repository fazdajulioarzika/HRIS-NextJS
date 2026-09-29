"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/lib/actions/departments";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function DepartmentTable({
  initialDepartments,
}: {
  initialDepartments: Department[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & sort
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const sortedDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = query
      ? initialDepartments.filter(
          (dept) =>
            dept.name.toLowerCase().includes(query) ||
            dept.description?.toLowerCase().includes(query)
        )
      : initialDepartments;

    return [...filtered].sort((a, b) => {
      const result = a.name.localeCompare(b.name);
      return sortDir === "asc" ? result : -result;
    });
  }, [initialDepartments, search, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedDepartments.length / pageSize)
  );

  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDepartments.slice(start, start + pageSize);
  }, [sortedDepartments, page]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setName(dept.name);
    setDescription(dept.description ?? "");
    setFormError(null);
    setFormOpen(true);
  }

  function handleSubmit() {
    setFormError(null);
    startTransition(async () => {
      const input = { name, description };
      const result = editing
        ? await updateDepartment(editing.id, input)
        : await createDepartment(input);

      if (result.error) {
        setFormError(result.error);
        return;
      }
      setFormOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteDepartment(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Department
        </Button>
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
              <TableHead>Description</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDepartments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  {search
                    ? "Tidak ada departemen yang cocok."
                    : "Belum ada departemen. Tambahkan yang pertama."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedDepartments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dept.description || "-"}
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
                        <DropdownMenuItem onClick={() => openEdit(dept)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(dept)}
                        >
                          <Trash2 className="size-4" />
                          Delete
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
          {sortedDepartments.length === 0
            ? "0 results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                sortedDepartments.length
              )} of ${sortedDepartments.length}`}
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Department" : "Add Department"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi departemen."
                : "Buat departemen baru untuk struktur organisasi."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Information Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
              {isPending
                ? "Saving..."
                : editing
                ? "Save changes"
                : "Add department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              Departemen &quot;{deleteTarget?.name}&quot; akan dihapus permanen.
              Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
