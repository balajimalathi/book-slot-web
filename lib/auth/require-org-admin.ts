import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { organizationMember as organizationMemberTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function requireOrgAdmin(orgId: string): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; status: number; error: string }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const [memberRow] = await db
    .select({ role: organizationMemberTable.role })
    .from(organizationMemberTable)
    .where(
      and(
        eq(organizationMemberTable.userId, userId),
        eq(organizationMemberTable.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!memberRow) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (memberRow.role === "staff") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId, role: memberRow.role };
}

