import { NextResponse } from "next/server";
import { getSessionOrApiKeyUser } from "@/lib/auth/api-key-auth";
import { db } from "@/lib/db/db";
import { apiKey as apiKeyTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionOrApiKeyUser();
  if (!ctx || ctx.source !== "session") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [keyRow] = await db
    .select()
    .from(apiKeyTable)
    .where(and(eq(apiKeyTable.id, id), eq(apiKeyTable.userId, ctx.user.id)))
    .limit(1);

  if (!keyRow) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await db
    .update(apiKeyTable)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeyTable.id, id));

  return NextResponse.json({ success: true });
}
