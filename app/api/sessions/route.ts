import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { session as sessionTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  let browser = "Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";

  let os = "Unknown";
  if (ua.includes("win")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return `${browser} on ${os}`;
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: sessionTable.id,
      userAgent: sessionTable.userAgent,
      ipAddress: sessionTable.ipAddress,
      createdAt: sessionTable.createdAt,
      expiresAt: sessionTable.expiresAt,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, session.user.id));

  const currentSessionId = session.session?.id ?? null;

  const sessions = rows.map((row) => ({
    id: row.id,
    device: getDeviceLabel(row.userAgent),
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isCurrent: currentSessionId === row.id,
  }));

  return NextResponse.json({ sessions });
}
