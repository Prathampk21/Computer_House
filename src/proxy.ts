import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;

  if (url.pathname === "/" && url.searchParams.has("ref")) {
    const referralUrl = new URL("/api/referral", request.url);
    referralUrl.searchParams.set("ref", url.searchParams.get("ref") ?? "");
    return NextResponse.redirect(referralUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
