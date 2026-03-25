import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/dash/:path*"],
};

export async function middleware(req: NextRequest) {
  // Middleware runs in Edge runtime. Avoid importing BetterAuth here (it
  // pulls in dynamic code + Node-only dependencies).
  //
  // We do a lightweight check: if the BetterAuth session cookie isn't
  // present, redirect to login. The server-rendered dashboard layout
  // performs full session validation.
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

