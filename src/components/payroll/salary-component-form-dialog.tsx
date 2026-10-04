"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createSalaryComponent,
  updateSalaryComponent,
} from "@/lib/actions/salary-components";

interface Component {
  id: string;
  name: string;
  type: "allowance" | "deduction";
  calculation_type:
    | "fixed"
    | "percentage_of_basic"
    | "percentage_of_daily"
    | "percentage_of_daily_absent";
  default_amount: number;
  is_active: boolean;
}

const typeLabel: Record<string, string> = {
  allowance: "Allowance (Tunjangan)",
  deduction: "Deduction (Potongan)",
};

const calcTypeLabel: Record<string, string> = {
  fixed: "Nominal Tetap (Rp)",
  percentage_of_basic: "% dari Gaji Pokok",
  percentage_of_daily: "% dari Gaji Harian, per kejadian (mis. telat)",
  percentage_of_daily_absent: "% dari Gaji Harian, per hari absen",
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function SalaryComponentFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Component | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"allowance" | "deduction">("allowance");
  type CalcType =
    | "fixed"
    | "percentage_of_basic"
    | "percentage_of_daily"
    | "percentage_of_daily_absent";

  const [calculationType, setCalculationType] = useState<CalcType>("fixed");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Simpan calculation_type awal (saat dialog dibuka) untuk deteksi perubahan
  const [initialCalcType, setInitialCalcType] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setCalculationType(editing.calculation_type);
      setDefaultAmount(String(editing.default_amount));
      setIsActive(editing.is_active);
      setInitialCalcType(editing.calculation_type);
    } else {
      setName("");
      setType("allowance");
      setCalculationType("fixed");
      setDefaultAmount("");
      setIsActive(true);
      setInitialCalcType("fixed");
    }
  }, [open, editing]);
  function handleCalcTypeChange(value: string | null) {
    const newType = (value as CalcType) ?? "fixed";
    if (newType !== calculationType) {
      setDefaultAmount("");
    }
    setCalculationType(newType);
  }

  const isPercentage = calculationType !== "fixed";
  const hasCalcTypeChangedFromInitial =
    editing !== null && calculationType !== initialCalcType;

  // (c) Preview kalkulasi untuk sanity-check, pakai contoh gaji pokok Rp10.000.000
  const previewBasicSalary = 10_000_000;
  const previewResult = useMemo(() => {
    const amount = Number(defaultAmount);
    if (!defaultAmount || isNaN(amount)) return null;

    if (calculationType === "fixed") {
      return amount;
    }
    if (calculationType === "percentage_of_basic") {
      return Math.round((previewBasicSalary * amount) / 100);
    }
    if (calculationType === "percentage_of_daily") {
      const dailyRate = previewBasicSalary / 22; // asumsi 22 hari kerja untuk preview
      return Math.round((dailyRate * amount) / 100);
    }
    if (calculationType === "percentage_of_daily_absent") {
      const dailyRate = previewBasicSalary / 22;
      return Math.round((dailyRate * amount) / 100); // simulasi 1 hari absen
    }
    return null;
  }, [defaultAmount, calculationType]);

  function handleSubmit() {
    setError(null);

    const payload = {
      name,
      type,
      calculation_type: calculationType,
      default_amount: Number(defaultAmount),
      is_active: isActive,
    };

    startTransition(async () => {
      const result = editing
        ? await updateSalaryComponent(editing.id, payload)
        : await createSalaryComponent(payload);

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
          <DialogTitle>
            {editing ? "Edit Component" : "Add Component"}
          </DialogTitle>
          <DialogDescription>
            Komponen ini akan dipakai otomatis setiap kali HR generate payroll
            periode baru. Perubahan tidak memengaruhi payroll yang sudah
            di-generate sebelumnya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tunjangan Transport"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType((v as "allowance" | "deduction") ?? "allowance")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{typeLabel[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allowance">{typeLabel.allowance}</SelectItem>
                <SelectItem value="deduction">{typeLabel.deduction}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Calculation Type</Label>
            <Select
              value={calculationType}
              onValueChange={handleCalcTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{calcTypeLabel[calculationType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">{calcTypeLabel.fixed}</SelectItem>
                <SelectItem value="percentage_of_basic">
                  {calcTypeLabel.percentage_of_basic}
                </SelectItem>
                <SelectItem value="percentage_of_daily">
                  {calcTypeLabel.percentage_of_daily}
                </SelectItem>
                <SelectItem value="percentage_of_daily_absent">
                  {calcTypeLabel.percentage_of_daily_absent}
                </SelectItem>
              </SelectContent>
            </Select>
            {calculationType === "percentage_of_daily" && (
              <p className="text-xs text-muted-foreground">
                Dikalikan jumlah kejadian (misal: jumlah hari telat dalam
                sebulan).
              </p>
            )}
            {hasCalcTypeChangedFromInitial && (
              <p className="text-xs text-orange-600">
                Tipe perhitungan diubah dari semula — pastikan nilai di bawah
                sudah disesuaikan skalanya (Rupiah vs persen).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{isPercentage ? "Percentage (%)" : "Amount (Rp)"}</Label>
            <Input
              type="number"
              min={0}
              step={isPercentage ? 0.1 : 1000}
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder={isPercentage ? "contoh: 2.5" : "contoh: 300000"}
            />
          </div>

          {previewResult !== null && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                Simulasi untuk gaji pokok {formatRupiah(previewBasicSalary)}
                {calculationType === "percentage_of_daily" &&
                  " (asumsi 22 hari kerja, 1 kejadian)"}
                :
              </p>
              <p className="font-semibold">{formatRupiah(previewResult)}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || defaultAmount === ""}
          >
            {isPending
              ? "Saving..."
              : editing
              ? "Save changes"
              : "Add component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
