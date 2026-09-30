"use client";

import { useState } from "react";
import { OvertimeApprovalList } from "./overtime-approval-list";
import { OvertimeHistoryList } from "./overtime-history-list";

interface OvertimeRow {
  id: string;
  full_name: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  reason: string;
  status: string;
  rejection_reason: string | null;
}

export function OvertimeApprovalTabs({
  pendingRows,
  historyRows,
  role,
}: {
  pendingRows: OvertimeRow[];
  historyRows: OvertimeRow[];
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
        <OvertimeApprovalList rows={pendingRows} role={role} />
      ) : (
        <OvertimeHistoryList rows={historyRows} />
      )}
    </div>
  );
}
