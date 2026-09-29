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

import { cancelLeaveRequest } from "@/lib/actions/leave";

interface LeaveRecord {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  rejection_reason: string | null;
  type_name: string;
}

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

export function LeaveHistory({
  records,
  statusLabel,
}: {
  records: LeaveRecord[];
  statusLabel: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelLeaveRequest(id);
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
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Belum ada pengajuan.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.type_name}</TableCell>
                  <TableCell>
                    {new Date(r.start_date).toLocaleDateString("id-ID")} –{" "}
                    {new Date(r.end_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{r.total_days}</TableCell>
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
