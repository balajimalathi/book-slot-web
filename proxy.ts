import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/dash", request.url));
  }
  if (!sessionCookie && pathname === "/dash") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dash", "/login"],
};
