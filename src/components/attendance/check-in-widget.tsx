"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { checkIn, checkOut } from "@/lib/actions/attendance";

interface TodayAttendance {
  check_in: string | null;
  check_out: string | null;
  status: string;
  late_minutes: number;
}

function getLocation(): Promise<{
  latitude: number | null;
  longitude: number | null;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve({ latitude: null, longitude: null }),
      { timeout: 5000 }
    );
  });
}

const statusLabel: Record<string, string> = {
  present: "On Time",
  late: "Late",
};

export function CheckInWidget({ today }: { today: TodayAttendance | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const location = await getLocation();
      const result = await checkIn(location);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCheckOut() {
    setError(null);
    startTransition(async () => {
      const location = await getLocation();
      const result = await checkOut(location);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const formatTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        })
      : "--:--";

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Asia/Jakarta",
              })}
            </p>
          </div>
          {today && (
            <Badge
              variant={today.status === "late" ? "destructive" : "default"}
            >
              {statusLabel[today.status] ?? today.status}
              {today.late_minutes > 0 ? ` (${today.late_minutes}m)` : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Clock className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Check In</p>
              <p className="font-medium">
                {formatTime(today?.check_in ?? null)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Clock className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Check Out</p>
              <p className="font-medium">
                {formatTime(today?.check_out ?? null)}
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          {!today?.check_in ? (
            <Button
              onClick={handleCheckIn}
              disabled={isPending}
              className="flex-1"
            >
              <LogIn className="size-4" />
              {isPending ? "Processing..." : "Check In"}
            </Button>
          ) : !today?.check_out ? (
            <Button
              onClick={handleCheckOut}
              disabled={isPending}
              className="flex-1"
            >
              <LogOut className="size-4" />
              {isPending ? "Processing..." : "Check Out"}
            </Button>
          ) : (
            <p className="flex-1 text-center text-sm text-muted-foreground">
              Anda sudah menyelesaikan absensi hari ini.
            </p>
          )}
        </div>

        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          Lokasi akan direkam saat check-in/check-out (izinkan akses lokasi di
          browser).
        </p>
      </CardContent>
    </Card>
  );
}
