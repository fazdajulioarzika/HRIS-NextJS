"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createPosition,
  deletePosition,
  updatePosition,
} from "@/lib/actions/positions";

interface Position {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  departments: { name: string } | null; // objek tunggal, bukan array
}

interface DepartmentOption {
  id: string;
  name: string;
}

export function PositionTable({
  initialPositions,
  departments,
}: {
  initialPositions: Position[];
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const sortedPositions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = query
      ? initialPositions.filter(
          (pos) =>
            pos.name.toLowerCase().includes(query) ||
            pos.departments?.name.toLowerCase().includes(query)
        )
      : initialPositions;

    return [...filtered].sort((a, b) => {
      const nameA = a.departments?.name ?? "";
      const nameB = b.departments?.name ?? "";
      const result = nameA.localeCompare(nameB);
      return sortDir === "asc" ? result : -result;
    });
  }, [initialPositions, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPositions.length / pageSize));

  const paginatedPositions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPositions.slice(start, start + pageSize);
  }, [sortedPositions, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }
  function openCreate() {
    setEditing(null);
    setName("");
    setDepartmentId("");
    setDescription("");
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(pos: Position) {
    setEditing(pos);
    setName(pos.name);
    setDepartmentId(pos.department_id);
    setDescription(pos.description ?? "");
    setFormError(null);
    setFormOpen(true);
  }

  function handleSubmit() {
    setFormError(null);
    startTransition(async () => {
      const input = { name, department_id: departmentId, description };
      const result = editing
        ? await updatePosition(editing.id, input)
        : await createPosition(input);

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
      const result = await deletePosition(deleteTarget.id);
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
            placeholder="Search positions or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button onClick={openCreate} disabled={departments.length === 0}>
          <Plus className="size-4" />
          Add Position
        </Button>
      </div>

      {departments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Buat departemen terlebih dahulu sebelum menambahkan posisi.
        </p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={toggleSort}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Department
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPositions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {search
                    ? "Tidak ada posisi yang cocok."
                    : "Belum ada posisi."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPositions.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell className="font-medium">{pos.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {pos.departments?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pos.description || "-"}
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
                        <DropdownMenuItem onClick={() => openEdit(pos)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(pos)}
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
          {sortedPositions.length === 0
            ? "0 results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                sortedPositions.length
              )} of ${sortedPositions.length}`}
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
              {editing ? "Edit Position" : "Add Position"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi posisi."
                : "Buat posisi baru di salah satu departemen."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pos-name">Name</Label>
              <Input
                id="pos-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Backend Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pos-department">Department</Label>
              <Select
                value={departmentId}
                onValueChange={(value) => setDepartmentId(value ?? "")}
              >
                <SelectTrigger id="pos-department" className="w-full">
                  <SelectValue placeholder="Select department">
                    {(value: string | null) =>
                      departments.find((d) => d.id === value)?.name ??
                      "Select department"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pos-description">Description</Label>
              <Textarea
                id="pos-description"
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
            <Button
              onClick={handleSubmit}
              disabled={isPending || !name.trim() || !departmentId}
            >
              {isPending
                ? "Saving..."
                : editing
                ? "Save changes"
                : "Add position"}
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
            <AlertDialogTitle>Delete position?</AlertDialogTitle>
            <AlertDialogDescription>
              Posisi &quot;{deleteTarget?.name}&quot; akan dihapus permanen.
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
