import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import { service as serviceTable } from "@/lib/db/schema";
import { ServiceSchema } from "@/lib/validations/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const authz = await requireOrgAdmin(orgId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const rows = await db
    .select({
      id: serviceTable.id,
      name: serviceTable.name,
      description: serviceTable.description,
      durationMinutes: serviceTable.durationMinutes,
      price: serviceTable.price,
      depositAmount: serviceTable.depositAmount,
      currency: serviceTable.currency,
      isActive: serviceTable.isActive,
      imageUrl: serviceTable.imageUrl,
      staffIds: serviceTable.staffIds,
      createdAt: serviceTable.createdAt,
      updatedAt: serviceTable.updatedAt,
    })
    .from(serviceTable)
    .where(eq(serviceTable.organizationId, orgId))
    .orderBy(serviceTable.createdAt);

  return NextResponse.json({
    services: rows.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      // Keep JSON fields always shaped for the UI
      staffIds: Array.isArray(s.staffIds) ? s.staffIds : [],
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

  const parsed = ServiceSchema.parse(body);
  const now = new Date();

  const id = randomUUID();

  await db.insert(serviceTable).values({
    id,
    organizationId: orgId,
    name: parsed.name,
    description: parsed.description && parsed.description !== "" ? parsed.description : null,
    durationMinutes: parsed.durationMinutes,
    price: parsed.price,
    depositAmount: parsed.depositAmount ?? null,
    currency: parsed.currency,
    isActive: parsed.isActive,
    // Staff are not modeled as rows yet; keep the structure for future expansion.
    staffIds: [],
    imageUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id });
}

