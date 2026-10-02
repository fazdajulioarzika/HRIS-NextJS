"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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

import { getPayrollDetail, updatePayrollManual } from "@/lib/actions/payroll";

interface Item {
  name: string;
  amount: number;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PayrollItemEditDialog({
  payrollId,
  employeeName,
  open,
  onOpenChange,
}: {
  payrollId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodStatus, setPeriodStatus] = useState<string | null>(null);

  const [basicSalary, setBasicSalary] = useState(0);
  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [allowanceItems, setAllowanceItems] = useState<Item[]>([]);
  const [deductionItems, setDeductionItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    getPayrollDetail(payrollId).then((result) => {
      setLoading(false);
      if (result.error || !result.payroll) {
        setError(result.error ?? "Gagal memuat data");
        return;
      }

      setBasicSalary(Number(result.payroll.basic_salary));
      setOvertimeAmount(Number(result.payroll.total_overtime));
      setBonus(Number(result.payroll.total_bonus));
      setPeriodStatus(result.periodStatus ?? null);

      const allowances = result.items
        .filter((i: any) => i.type === "allowance")
        .map((i: any) => ({
          name: i.component_name,
          amount: Number(i.amount),
        }));
      const deductions = result.items
        .filter((i: any) => i.type === "deduction")
        .map((i: any) => ({
          name: i.component_name,
          amount: Number(i.amount),
        }));

      setAllowanceItems(allowances);
      setDeductionItems(deductions);
    });
  }, [open, payrollId]);

  function updateItem(
    list: Item[],
    setList: (v: Item[]) => void,
    index: number,
    field: "name" | "amount",
    value: string
  ) {
    const updated = [...list];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) || 0 : value,
    };
    setList(updated);
  }

  function removeItem(
    list: Item[],
    setList: (v: Item[]) => void,
    index: number
  ) {
    setList(list.filter((_, i) => i !== index));
  }

  function addItem(list: Item[], setList: (v: Item[]) => void) {
    setList([...list, { name: "", amount: 0 }]);
  }

  const totalAllowance = allowanceItems.reduce((sum, a) => sum + a.amount, 0);
  const totalDeduction = deductionItems.reduce((sum, d) => sum + d.amount, 0);
  const grossSalary = basicSalary + totalAllowance + overtimeAmount + bonus;
  const netSalary = grossSalary - totalDeduction;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updatePayrollManual(payrollId, {
        basicSalary,
        bonus,
        allowanceItems: allowanceItems.filter((a) => a.name.trim()),
        overtimeAmount,
        deductionItems: deductionItems.filter((d) => d.name.trim()),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const isLocked = periodStatus === "approved" || periodStatus === "paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Payroll — {employeeName}</DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Periode ini sudah final. Mengubah data bisa memengaruhi laporan yang sudah disetujui."
              : "Sesuaikan komponen gaji untuk karyawan ini."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Overtime (dari attendance, boleh dikoreksi)</Label>
              <Input
                type="number"
                value={overtimeAmount}
                onChange={(e) => setOvertimeAmount(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Bonus</Label>
              <Input
                type="number"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Allowance Items</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addItem(allowanceItems, setAllowanceItems)}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {allowanceItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Nama komponen"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(
                        allowanceItems,
                        setAllowanceItems,
                        i,
                        "name",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    value={item.amount}
                    onChange={(e) =>
                      updateItem(
                        allowanceItems,
                        setAllowanceItems,
                        i,
                        "amount",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeItem(allowanceItems, setAllowanceItems, i)
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Deduction Items</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addItem(deductionItems, setDeductionItems)}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {deductionItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Nama komponen"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(
                        deductionItems,
                        setDeductionItems,
                        i,
                        "name",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    value={item.amount}
                    onChange={(e) =>
                      updateItem(
                        deductionItems,
                        setDeductionItems,
                        i,
                        "amount",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeItem(deductionItems, setDeductionItems, i)
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-md border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Salary</span>
                <span className="font-medium">{formatRupiah(grossSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deduction</span>
                <span className="font-medium text-destructive">
                  -{formatRupiah(totalDeduction)}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-1">
                <span className="font-semibold">Net Salary</span>
                <span className="font-semibold">{formatRupiah(netSalary)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || loading}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
