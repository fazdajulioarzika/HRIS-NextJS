"use client";

import { Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const statusLabel: Record<string, string> = {
  draft: "Belum Final",
  calculated: "Belum Final",
  reviewed: "Belum Final",
  approved: "Siap Diunduh",
  paid: "Dibayar",
};

interface PayslipRow {
  id: string;
  net_salary: number;
  period_name: string;
  status: string;
}

export function PayslipList({ rows }: { rows: PayslipRow[] }) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground">Belum ada slip gaji.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const isFinal = row.status === "approved" || row.status === "paid";

        return (
          <Card key={row.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <FileText className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{row.period_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRupiah(row.net_salary)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={isFinal ? "default" : "secondary"}>
                  {statusLabel[row.status]}
                </Badge>
                {isFinal ? (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a href={`/api/payslip/${row.id}`} download>
                        <Download className="size-4" />
                        Download
                      </a>
                    }
                  />
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Download className="size-4" />
                    Belum Tersedia
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
