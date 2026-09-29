"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { reviewLeaveAsManager, reviewLeaveAsHR } from "@/lib/actions/leave";

interface LeaveRow {
  id: string;
  full_name: string;
  type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
}

export function LeaveApprovalList({
  rows,
  role,
}: {
  rows: LeaveRow[];
  role: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<LeaveRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(id: string) {
    startTransition(async () => {
      const fn = role === "hr" ? reviewLeaveAsHR : reviewLeaveAsManager;
      await fn(id, "approve");
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    startTransition(async () => {
      const fn = role === "hr" ? reviewLeaveAsHR : reviewLeaveAsManager;
      await fn(rejectTarget.id, "reject", rejectReason);
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              {role === "hr" && <TableHead>Status</TableHead>}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={role === "hr" ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  Tidak ada pengajuan.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>{row.type_name}</TableCell>
                  <TableCell>
                    {new Date(row.start_date).toLocaleDateString("id-ID")} –{" "}
                    {new Date(row.end_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{row.total_days}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {row.reason}
                  </TableCell>
                  {role === "hr" && (
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "manager_approved"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {row.status === "manager_approved"
                          ? "Manager OK"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleApprove(row.id)}
                        disabled={isPending}
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setRejectTarget(row)}
                        disabled={isPending}
                      >
                        <X className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan (opsional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
