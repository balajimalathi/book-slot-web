import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { session as sessionTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db
    .select()
    .from(sessionTable)
    .where(
      and(eq(sessionTable.id, id), eq(sessionTable.userId, session.user.id))
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await db.delete(sessionTable).where(eq(sessionTable.id, id));

  return NextResponse.json({ success: true });
}
