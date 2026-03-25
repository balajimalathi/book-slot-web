import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import {
  organization as organizationTable,
  organizationMember as organizationMemberTable,
} from "@/lib/db/schema";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;

  const [memberRow] = await db
    .select({ organizationId: organizationMemberTable.organizationId })
    .from(organizationMemberTable)
    .where(eq(organizationMemberTable.userId, userId))
    .limit(1);

  const orgId = memberRow?.organizationId ?? null;

  if (!orgId) {
    return NextResponse.json({ onboarded: false, orgId: null });
  }

  if (role === "staff") {
    // Staff logins should never require onboarding, as they join an existing org.
    return NextResponse.json({ onboarded: true, orgId });
  }

  const [orgRow] = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    .limit(1);

  return NextResponse.json({
    // Org-only onboarding: once org + membership exist, we consider the user onboarded.
    onboarded: Boolean(orgRow),
    orgId,
  });
}

