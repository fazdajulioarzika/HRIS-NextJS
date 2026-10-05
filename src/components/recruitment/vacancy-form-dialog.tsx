"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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

import { createVacancy } from "@/lib/actions/recruitment";
import { employmentTypeValues } from "@/lib/validations/recruitment";

const employmentTypeLabel: Record<string, string> = {
  full_time: "Full Time",
  contract: "Contract",
  internship: "Internship",
  part_time: "Part Time",
};

export function VacancyFormDialog({
  open,
  onOpenChange,
  departments,
  positions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; department_id: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");
  useEffect(() => {
    if (!open) return;

    setError(null);
    setDepartmentId("");
    setPositionId("");
    setLocation("");
    setEmploymentType("full_time");
    setSalaryMin("");
    setSalaryMax("");
    setDescription("");
    setRequirements("");
    setDeadline("");
  }, [open]);
  const filteredPositions = useMemo(
    () => positions.filter((p) => p.department_id === departmentId),
    [positions, departmentId]
  );

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createVacancy({
        position_id: positionId,
        department_id: departmentId,
        location,
        employment_type: employmentType as any,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        description,
        requirements,
        deadline: deadline || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const isValid =
    departmentId &&
    positionId &&
    location &&
    description.length >= 10 &&
    requirements.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Job Vacancy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => {
                  setDepartmentId(v ?? "");
                  setPositionId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department">
                    {(v: string | null) =>
                      departments.find((d) => d.id === v)?.name ??
                      "Select department"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={positionId}
                onValueChange={(v) => setPositionId(v ?? "")}
                disabled={!departmentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select position">
                    {(v: string | null) =>
                      filteredPositions.find((p) => p.id === v)?.name ??
                      "Select position"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Jakarta"
            />
          </div>

          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select
              value={employmentType}
              onValueChange={(v) => setEmploymentType(v ?? "full_time")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{employmentTypeLabel[employmentType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {employmentTypeValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {employmentTypeLabel[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salary Min (Rp)</Label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Salary Max (Rp)</Label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Requirements</Label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Deadline (opsional)</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending ? "Creating..." : "Create Vacancy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
