import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import { blackoutDate as blackoutDateTable } from "@/lib/db/schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> },
) {
  const { orgId, id } = await params;

  const authz = await requireOrgAdmin(orgId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const [existing] = await db
    .select({ id: blackoutDateTable.id, organizationId: blackoutDateTable.organizationId })
    .from(blackoutDateTable)
    .where(eq(blackoutDateTable.id, id))
    .limit(1);

  if (!existing || existing.organizationId !== orgId) {
    return NextResponse.json({ error: "Blackout not found" }, { status: 404 });
  }

  await db
    .delete(blackoutDateTable)
    .where(
      // Delete with an org-scoped filter for defense-in-depth.
      and(eq(blackoutDateTable.id, id), eq(blackoutDateTable.organizationId, orgId)),
    );

  return NextResponse.json({ success: true });
}

