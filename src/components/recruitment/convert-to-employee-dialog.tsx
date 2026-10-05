"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { convertCandidateToEmployee } from "@/lib/actions/recruitment";

export function ConvertToEmployeeDialog({
  candidate,
  defaultPositionId,
  defaultDepartmentId,
  open,
  onOpenChange,
}: {
  candidate: { id: string; full_name: string; email: string };
  defaultPositionId: string;
  defaultDepartmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nik, setNik] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [basicSalary, setBasicSalary] = useState("");

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await convertCandidateToEmployee(candidate.id, {
        nik,
        join_date: joinDate,
        basic_salary: Number(basicSalary),
        position_id: defaultPositionId,
        department_id: defaultDepartmentId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Employee</DialogTitle>
          <DialogDescription>
            {candidate.full_name} akan diundang lewat email ({candidate.email})
            untuk membuat akun karyawan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>NIK</Label>
            <Input value={nik} onChange={(e) => setNik(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Join Date</Label>
            <Input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Basic Salary (Rp)</Label>
            <Input
              type="number"
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
          <Button
            onClick={handleSubmit}
            disabled={isPending || !nik || !joinDate || !basicSalary}
          >
            {isPending ? "Converting..." : "Convert & Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
