"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createClient } from "@/lib/supabase/client";
import { updateMyPhoto, updateMyContactInfo } from "@/lib/actions/my-profile";
interface ProfileInfo {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface EmployeeInfo {
  id: string;
  nik: string;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  join_date: string;
  employment_status: string;
  photo_url: string | null;
  departments: { name: string } | null;
  positions: { name: string } | null;
  manager: { profiles: { full_name: string } | null } | null;
}
function getManagerName(manager: any): string {
  if (!manager) return "-";
  const managerData = Array.isArray(manager) ? manager[0] : manager;
  const profileData = Array.isArray(managerData?.profiles)
    ? managerData.profiles[0]
    : managerData?.profiles;
  return profileData?.full_name ?? "-";
}
export function MyProfileForm({
  profile,
  employee,
}: {
  profile: ProfileInfo | null;
  employee: EmployeeInfo | null;
}) {
  const router = useRouter();

  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [address, setAddress] = useState(employee?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setSaving(true);

    const result = await updateMyContactInfo({ phone, address });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    setUploadingAvatar(true);
    setError(null);

    const supabase = createClient();
    const path = `${employee.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("employee-photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      setError(`Gagal upload foto: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage
      .from("employee-photos")
      .getPublicUrl(path);
    const result = await updateMyPhoto(data.publicUrl);
    setUploadingAvatar(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const initials = (profile?.full_name ?? profile?.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={employee?.photo_url ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadingAvatar}
            />
            <p className="text-xs text-muted-foreground">
              Foto ini akan sama dengan foto yang ditampilkan HR di data
              karyawan.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Full Name</Label>
            <p className="font-medium">{profile?.full_name ?? "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{profile?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">NIK</Label>
            <p className="font-medium">{employee?.nik ?? "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Department</Label>
            <p className="font-medium">{employee?.departments?.name ?? "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Position</Label>
            <p className="font-medium">{employee?.positions?.name ?? "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Manager</Label>
            <p className="font-medium">{getManagerName(employee?.manager)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <div>
              <Badge variant="secondary">
                {employee?.employment_status ?? "-"}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Data di atas hanya bisa diubah oleh HR. Hubungi HR kalau ada yang
            perlu dikoreksi.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="my-phone">Phone</Label>
            <Input
              id="my-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="my-address">Address</Label>
            <Textarea
              id="my-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Tersimpan.</p>}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
