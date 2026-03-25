import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);

  // Always include the current pathname so layouts/pages can branch on it.
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Run on all app routes so `x-pathname` is always available,
  // and still support dashboard subdomain resolution.
  matcher: ["/:path*"],
};

