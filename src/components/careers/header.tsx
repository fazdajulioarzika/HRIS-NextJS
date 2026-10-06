import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CareersHeader({
  showBackButton = false,
}: {
  showBackButton?: boolean;
}) {
  return (
    <div className="block md:flex items-center justify-between mb-16 space-y-1 bg-black text-white p-6 sticky top-0 z-10">
      <div>
        <h1 className="text-lg md:text-3xl font-bold">
          Karir di PT Arzikadev Indonesia
        </h1>
        <p>Lowongan yang sedang dibuka.</p>
      </div>

      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href="/careers">
              <ArrowLeft className="size-4" />
              Kembali ke daftar lowongan
            </Link>
          }
        />
      )}
    </div>
  );
}
