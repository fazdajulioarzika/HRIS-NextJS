"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

import { updateCandidateStatus } from "@/lib/actions/recruitment";

export function InterviewDetailsDialog({
  candidateId,
  status,
  open,
  onOpenChange,
}: {
  candidateId: string;
  status: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      await updateCandidateStatus(candidateId, status, { date, time, link });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail Interview / Test</DialogTitle>
          <DialogDescription>
            Informasi ini akan disisipkan otomatis ke email notifikasi kandidat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link / Lokasi</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. Google Meet link atau alamat kantor"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip (kirim tanpa detail)
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Sending..." : "Send Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
