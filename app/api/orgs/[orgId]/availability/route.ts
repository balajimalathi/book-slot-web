import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import { availability as availabilityTable, organization as organizationTable } from "@/lib/db/schema";
import { AvailabilitySettingsSchema } from "@/lib/validations/availability-settings";

const ORG_WIDE_STAFF_ID = "org-wide";

function defaultDay() {
  return {
    isActive: false,
    startTime: "09:00",
    endTime: "17:00",
  };
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
    .select({
      bufferMinutes: organizationTable.bufferMinutes,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    ;

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      weekday: availabilityTable.weekday,
      isActive: availabilityTable.isActive,
      startTime: availabilityTable.startTime,
      endTime: availabilityTable.endTime,
    })
    .from(availabilityTable)
    .where(
      and(
        eq(availabilityTable.organizationId, orgId),
        eq(availabilityTable.staffId, ORG_WIDE_STAFF_ID),
      ),
    );

  const byWeekday = new Map<number, (typeof rows)[number]>();
  for (const r of rows) byWeekday.set(r.weekday, r);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const r = byWeekday.get(i);
    return r
      ? {
          isActive: Boolean(r.isActive),
          startTime: r.startTime,
          endTime: r.endTime,
        }
      : defaultDay();
  });

  return NextResponse.json({
    availability: {
      bufferMinutes: orgRow.bufferMinutes,
      days,
    },
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

  const parsed = AvailabilitySettingsSchema.parse(body);
  const now = new Date();

  // Replace the org-wide availability rows (staffId isn't modeled yet, so use a constant).
  await db
    .delete(availabilityTable)
    .where(
      and(
        eq(availabilityTable.organizationId, orgId),
        eq(availabilityTable.staffId, ORG_WIDE_STAFF_ID),
      ),
    );

  await db
    .update(organizationTable)
    .set({
      bufferMinutes: parsed.bufferMinutes,
      updatedAt: now,
    })
    .where(eq(organizationTable.id, orgId));

  await db.insert(availabilityTable).values(
    parsed.days.map((d, weekday) => ({
      id: randomUUID(),
      organizationId: orgId,
      staffId: ORG_WIDE_STAFF_ID,
      weekday,
      isActive: d.isActive,
      startTime: d.startTime,
      endTime: d.endTime,
      createdAt: now,
      updatedAt: now,
    })),
  );

  return NextResponse.json({ success: true });
}

