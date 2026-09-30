"use client";

import { useState } from "react";
import { LeaveApprovalList } from "./leave-approval-list";
import { LeaveHistoryList } from "./leave-history-list";

interface LeaveRow {
  id: string;
  full_name: string;
  type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  rejection_reason: string | null;
}

export function LeaveApprovalTabs({
  pendingRows,
  historyRows,
  role,
}: {
  pendingRows: LeaveRow[];
  historyRows: LeaveRow[];
  role: string;
}) {
  const [tab, setTab] = useState<"pending" | "history">("pending");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("pending")}
          className={`border-b-2 px-3 py-2 text-sm ${
            tab === "pending"
              ? "border-foreground font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Pending ({pendingRows.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`border-b-2 px-3 py-2 text-sm ${
            tab === "history"
              ? "border-foreground font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          History
        </button>
      </div>

      {tab === "pending" ? (
        <LeaveApprovalList rows={pendingRows} role={role} />
      ) : (
        <LeaveHistoryList rows={historyRows} />
      )}
    </div>
  );
}
