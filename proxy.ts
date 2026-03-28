import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isPublicOrgSlugPath = /^\/[^/]+$/.test(pathname);
  const reservedTopLevel = new Set([
    "",
    "api",
    "login",
    "signup",
    "forgot-password",
    "reset-password",
    "onboarding",
    "dash",
    "book",
  ]);
  if (isPublicOrgSlugPath) {
    const slug = pathname.slice(1);
    if (!reservedTopLevel.has(slug)) {
      return NextResponse.rewrite(new URL(`/book/${slug}`, req.url));
    }
  }

  const requiresAuth =
    pathname === "/dash" ||
    pathname.startsWith("/dash/") ||
    /^\/[^/]+\/dash(?:\/|$)/.test(pathname) ||
    /^\/[^/]+\/settings(?:\/|$)/.test(pathname);
  if (!requiresAuth) {
    return NextResponse.next();
  }

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

  const onboardingPath = "/onboarding";

  if (pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`)) {
    return NextResponse.next();
  }

  const getOrgIdFromDashPath = (p: string): string | null => {
    const match = p.match(/^\/([^/]+)\/dash(?:\/|$)/);
    return match?.[1] ?? null;
  };

  const getOrgIdFromSettingsPath = (p: string): string | null => {
    const match = p.match(/^\/([^/]+)\/settings(?:\/|$)/);
    return match?.[1] ?? null;
  };

  const requestedOrgId = getOrgIdFromDashPath(pathname);
  const requestedSettingsOrgId = getOrgIdFromSettingsPath(pathname);

  try {
    const statusUrl = new URL("/api/onboarding/status", req.url);
    const statusRes = await fetch(statusUrl, {
      headers: {
        // Forward cookies so the status API can validate the session.
        cookie: req.headers.get("cookie") ?? "",
      },
    });

    if (!statusRes.ok) return NextResponse.next();

    const data = (await statusRes.json()) as {
      onboarded?: boolean;
      orgId?: string | null;
    };

    const onboarded = data.onboarded === true;
    const orgId = data.orgId ?? null;

    // New URL scheme: /:orgId/dash/*
    if (requestedOrgId || requestedSettingsOrgId) {
      const expectedOrgId = requestedOrgId ?? requestedSettingsOrgId;
      if (!onboarded || !orgId || orgId !== expectedOrgId) {
        return NextResponse.redirect(new URL(onboardingPath, req.url));
      }
      return NextResponse.next();
    }

    // Legacy URLs: /dash/* -> redirect to /:orgId/dash/*
    if (!onboarded || !orgId) {
      return NextResponse.redirect(new URL(onboardingPath, req.url));
    }

    const legacyRemainder = pathname.replace(/^\/dash/, "");

    // Legacy settings are now at /:orgId/settings/*
    if (legacyRemainder.startsWith("/settings")) {
      const url = new URL(`/${orgId}${legacyRemainder}`, req.url);
      return NextResponse.redirect(url);
    }

    // Special case: organization wizard moved to /onboarding
    if (legacyRemainder.startsWith("/settings/organization")) {
      return NextResponse.redirect(new URL(onboardingPath, req.url));
    }

    const url = new URL(`/${orgId}/dash${legacyRemainder}`, req.url);
    return NextResponse.redirect(url);
  } catch {
    // Fail open: if the status check errors, don't block access.
  }

  return NextResponse.next();
}

