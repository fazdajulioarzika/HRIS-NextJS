"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cancelOvertimeRequest } from "@/lib/actions/overtime";

interface OvertimeRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  reason: string;
  status: string;
  rejection_reason: string | null;
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  manager_approved: "Manager Approved",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  manager_approved: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
};

export function OvertimeHistory({ records }: { records: OvertimeRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelOvertimeRequest(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">History</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Belum ada pengajuan.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>{r.total_hours}h</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {r.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]}>
                      {statusLabel[r.status]}
                    </Badge>
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.rejection_reason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(r.id)}
                        disabled={isPending}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
