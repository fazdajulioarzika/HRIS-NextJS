import Link from "next/link";

export function CareersFooter() {
  return (
    <footer className="border-t bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-semibold">PT Arzikadev Indonesia</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Membangun solusi digital terbaik untuk kebutuhan bisnis Anda.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Navigasi
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link
                  href="/careers"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Lowongan Kerja
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Kontak
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>hr@arzikadev.co.id</li>
              <li>Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PT Arzikadev Indonesia. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
