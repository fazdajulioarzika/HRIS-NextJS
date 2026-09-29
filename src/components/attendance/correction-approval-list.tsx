"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { reviewCorrection } from "@/lib/actions/attendance-corrections";

interface CorrectionRow {
  id: string;
  date: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  full_name: string;
  noManager: boolean;
}

export function CorrectionApprovalList({ rows }: { rows: CorrectionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReview(id: string, decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewCorrection(id, decision);
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Requested In</TableHead>
            <TableHead>Requested Out</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Tidak ada pengajuan pending.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.full_name}
                  {row.noManager && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (no manager — HR review)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(row.date).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>{row.requested_check_in ?? "-"}</TableCell>
                <TableCell>{row.requested_check_out ?? "-"}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {row.reason}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleReview(row.id, "approved")}
                      disabled={isPending}
                    >
                      <Check className="size-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleReview(row.id, "rejected")}
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
  );
}
