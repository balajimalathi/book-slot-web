import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { session as sessionTable } from "@/lib/db/schema";
import { and, eq, not } from "drizzle-orm";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentSessionId = session.session?.id;
  if (!currentSessionId) {
    return NextResponse.json({ error: "Session not found" }, { status: 400 });
  }

  await db
    .delete(sessionTable)
    .where(
      and(
        eq(sessionTable.userId, session.user.id),
        not(eq(sessionTable.id, currentSessionId))
      )
    );

  return NextResponse.json({ success: true });
}
