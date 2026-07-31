import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`. Same execution model:
// runs before the route renders.
//
// This is an *optimistic* check only — it verifies that an admin cookie is
// present, not that it is valid. Decrypting the iron-session seal here would
// pull the crypto work into every request. The authoritative check lives in
// app/admin/(protected)/layout.tsx, which every protected page renders through.
const ADMIN_COOKIE = "tr_admin";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /admin/login must stay reachable or an unauthenticated user cannot sign in.
  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.get(ADMIN_COOKIE)?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    // Remember where they were headed so login can bounce them back.
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only /admin/*. /api/track and /api/lead are deliberately excluded so the
  // public landing page can post to them without a session.
  matcher: ["/admin", "/admin/:path*"],
};
