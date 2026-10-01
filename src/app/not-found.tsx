import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <FileQuestion className="size-16 text-muted-foreground" />
      <div>
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/dashboard">Kembali ke Dashboard</Link>}
      />
    </div>
  );
}
