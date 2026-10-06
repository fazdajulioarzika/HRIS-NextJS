import { NextRequest, NextResponse } from "next/server";

const CAREERS_DOMAIN = "careers.arzikadev.my.id";

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }
  const host = req.headers.get("host") ?? "";
  const url = req.nextUrl.clone();

  if (host.startsWith(CAREERS_DOMAIN)) {
    // Domain careers: semua path diarahkan ke isi folder /careers
    if (!url.pathname.startsWith("/careers")) {
      url.pathname = `/careers${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // Domain hris (atau lainnya): tolak akses langsung ke /careers,
    // redirect ke domain careers supaya tidak ada duplikat URL
    if (url.pathname.startsWith("/careers")) {
      const redirectUrl = new URL(req.url);
      redirectUrl.hostname = CAREERS_DOMAIN;
      redirectUrl.pathname = url.pathname.replace(/^\/careers/, "") || "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
