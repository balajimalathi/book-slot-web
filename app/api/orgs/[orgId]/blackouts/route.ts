import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import {
  blackoutDate as blackoutDateTable,
  organization as organizationTable,
} from "@/lib/db/schema";
import { BlackoutDateRangeSchema } from "@/lib/validations/blackout-date";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseOrgMidnight(dateStr: string) {
  // Org timezone is currently fixed to UTC in onboarding, so interpret YYYY-MM-DD as UTC midnight.
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const authz = await requireOrgAdmin(orgId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const [orgRow] = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    .limit(1);

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: blackoutDateTable.id,
      startDate: blackoutDateTable.startDate,
      endDate: blackoutDateTable.endDate,
      reason: blackoutDateTable.reason,
      staffId: blackoutDateTable.staffId,
    })
    .from(blackoutDateTable)
    .where(eq(blackoutDateTable.organizationId, orgId))
    .orderBy(blackoutDateTable.startDate);

  return NextResponse.json({
    blackouts: rows.map((r) => ({
      id: r.id,
      from: toDateStr(r.startDate),
      to: toDateStr(r.endDate),
      reason: r.reason,
      staffId: r.staffId,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const authz = await requireOrgAdmin(orgId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BlackoutDateRangeSchema.parse(body);
  const now = new Date();

  await db.insert(blackoutDateTable).values({
    id: randomUUID(),
    organizationId: orgId,
    staffId: parsed.staffId ?? null,
    startDate: parseOrgMidnight(parsed.from),
    endDate: parseOrgMidnight(parsed.to),
    reason: parsed.reason ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true });
}

