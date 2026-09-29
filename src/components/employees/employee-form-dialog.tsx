"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createEmployee,
  updateEmployee,
  updateEmployeePhoto,
} from "@/lib/actions/employees";
import {
  employeeStatusValues,
  type EmployeeStatus,
} from "@/lib/validations/employee";
import type {
  DepartmentOption,
  EmployeeRow,
  ManagerOption,
  PositionOption,
} from "./types";

const statusLabel: Record<EmployeeStatus, string> = {
  active: "Active",
  probation: "Probation",
  contract: "Contract",
  permanent: "Permanent",
  resigned: "Resigned",
  terminated: "Terminated",
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editing,
  departments,
  positions,
  managers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EmployeeRow | null;
  departments: DepartmentOption[];
  positions: PositionOption[];
  managers: ManagerOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [managerId, setManagerId] = useState("none");
  const [basicSalary, setBasicSalary] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("probation");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (editing) {
      setFullName(editing.profiles?.full_name ?? "");
      setEmail(editing.profiles?.email ?? "");
      setNik(editing.nik);
      setPhone(editing.phone ?? "");
      setAddress(editing.address ?? ""); // ← diperbaiki
      setBirthDate(editing.birth_date ?? ""); // ← diperbaiki
      setJoinDate(editing.join_date);
      setDepartmentId(editing.department_id);
      setPositionId(editing.position_id);
      setManagerId(editing.manager_id ?? "none");
      setBasicSalary(String(editing.basic_salary));
      setStatus(editing.employment_status);
      setPhotoPreview(editing?.photo_url ?? null);
      setPhotoFile(null);
    } else {
      setFullName("");
      setEmail("");
      setNik("");
      setPhone("");
      setAddress("");
      setBirthDate("");
      setJoinDate("");
      setDepartmentId("");
      setPositionId("");
      setManagerId("none");
      setBasicSalary("");
      setStatus("probation");
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [open, editing]);

  const filteredPositions = useMemo(
    () => positions.filter((p) => p.department_id === departmentId),
    [positions, departmentId]
  );

  useEffect(() => {
    if (positionId && !filteredPositions.some((p) => p.id === positionId)) {
      setPositionId("");
    }
  }, [departmentId, filteredPositions, positionId]);

  const availableManagers = managers.filter((m) => m.id !== editing?.id);

  async function uploadPhotoIfNeeded(
    employeeId: string
  ): Promise<string | undefined> {
    if (!photoFile) return undefined;

    const supabase = createClient();
    const ext = photoFile.name.split(".").pop();
    const path = `${employeeId}/${Date.now()}.${ext}`;

    setUploadingPhoto(true);
    const { error } = await supabase.storage
      .from("employee-photos")
      .upload(path, photoFile, { upsert: true });
    setUploadingPhoto(false);

    if (error) {
      setError(`Gagal upload foto: ${error.message}`);
      return undefined;
    }

    const { data } = supabase.storage
      .from("employee-photos")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  function handleSubmit() {
    setError(null);

    const basePayload = {
      full_name: fullName,
      nik,
      phone,
      address,
      birth_date: birthDate,
      join_date: joinDate,
      department_id: departmentId,
      position_id: positionId,
      manager_id: managerId === "none" ? null : managerId,
      basic_salary: Number(basicSalary),
      employment_status: status,
    };

    startTransition(async () => {
      let targetId: string | undefined;

      if (editing) {
        const result = await updateEmployee(
          editing.id,
          editing.profile_id,
          basePayload
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        targetId = editing.id;
      } else {
        const result = await createEmployee({ ...basePayload, email });
        if (result.error) {
          setError(result.error);
          return;
        }
        targetId = result.employeeId;
      }

      if (targetId && photoFile) {
        const photoUrl = await uploadPhotoIfNeeded(targetId);
        if (photoUrl) {
          await updateEmployeePhoto(targetId, photoUrl);
        }
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const isValid =
    fullName.trim() &&
    nik.trim() &&
    joinDate &&
    departmentId &&
    positionId &&
    basicSalary !== "" &&
    (editing || email.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Perbarui data kepegawaian karyawan."
              : "Karyawan akan menerima email undangan untuk membuat password."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex items-center gap-4">
              <div className="size-16 overflow-hidden rounded-sm bg-muted">
                {photoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhotoFile(file);
                  if (file) setPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Full name</Label>
              <Input
                id="emp-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!editing}
                placeholder="karyawan@company.com"
              />
              {editing && (
                <p className="text-xs text-muted-foreground">
                  Email tidak bisa diubah di sini.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-nik">NIK</Label>
              <Input
                id="emp-nik"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-phone">Phone</Label>
              <Input
                id="emp-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-address">Address</Label>
            <Textarea
              id="emp-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-birth">Birth date</Label>
              <Input
                id="emp-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-join">Join date</Label>
              <Input
                id="emp-join"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-department">Department</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setDepartmentId(v ?? "")}
              >
                <SelectTrigger id="emp-department" className="w-full">
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
              <Label htmlFor="emp-position">Position</Label>
              <Select
                value={positionId}
                onValueChange={(v) => setPositionId(v ?? "")}
                disabled={!departmentId}
              >
                <SelectTrigger id="emp-position" className="w-full">
                  <SelectValue placeholder="Select position">
                    {(value: string | null) =>
                      filteredPositions.find((p) => p.id === value)?.name ??
                      "Select position"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-manager">Manager</Label>
              <Select
                value={managerId}
                onValueChange={(v) => setManagerId(v ?? "none")}
              >
                <SelectTrigger id="emp-manager" className="w-full">
                  <SelectValue placeholder="No manager">
                    {(value: string | null) =>
                      !value || value === "none"
                        ? "No manager"
                        : availableManagers.find((m) => m.id === value)
                            ?.profiles?.full_name ?? "No manager"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {availableManagers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.profiles?.full_name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emp-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus((v as EmployeeStatus) ?? "probation")
                }
              >
                <SelectTrigger id="emp-status" className="w-full">
                  <SelectValue placeholder="Status">
                    {(value: string | null) =>
                      statusLabel[(value as EmployeeStatus) ?? "probation"]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-salary">Basic salary (Rp)</Label>
            <Input
              id="emp-salary"
              type="number"
              min={0}
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending
              ? "Saving..."
              : editing
              ? "Save changes"
              : "Add employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
