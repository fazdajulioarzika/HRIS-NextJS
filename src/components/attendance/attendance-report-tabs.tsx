"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyReport } from "./daily-report";
import { MonthlyReport } from "./monthly-report";

export function AttendanceReportTabs({
  view,
  dailyData,
  monthlyData,
}: {
  view: string;
  dailyData: any;
  monthlyData: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(newView: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`/attendance/report?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => switchView("daily")}
          className={`border-b-2 px-3 py-2 text-sm ${
            view === "daily"
              ? "border-foreground font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => switchView("monthly")}
          className={`border-b-2 px-3 py-2 text-sm ${
            view === "monthly"
              ? "border-foreground font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {view === "daily" ? (
        <DailyReport data={dailyData} />
      ) : (
        <MonthlyReport data={monthlyData} />
      )}
    </div>
  );
}
