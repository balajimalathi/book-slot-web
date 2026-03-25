import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import { service as serviceTable } from "@/lib/db/schema";
import { ServiceSchema } from "@/lib/validations/service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string; serviceId: string }> },
) {
  const { orgId, serviceId } = await params;

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

  const [existing] = await db
    .select({
      id: serviceTable.id,
      organizationId: serviceTable.organizationId,
    })
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
    .limit(1);

  if (!existing || existing.organizationId !== orgId) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await db
    .update(serviceTable)
    .set({
      name: parsed.name,
      description:
        parsed.description && parsed.description !== "" ? parsed.description : null,
      durationMinutes: parsed.durationMinutes,
      price: parsed.price,
      depositAmount: parsed.depositAmount ?? null,
      currency: parsed.currency,
      isActive: parsed.isActive,
      updatedAt: now,
    })
    .where(eq(serviceTable.id, serviceId))
    .limit(1);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; serviceId: string }> },
) {
  const { orgId, serviceId } = await params;

  const authz = await requireOrgAdmin(orgId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const [existing] = await db
    .select({ id: serviceTable.id, organizationId: serviceTable.organizationId })
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
    .limit(1);

  if (!existing || existing.organizationId !== orgId) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await db.delete(serviceTable).where(eq(serviceTable.id, serviceId));

  return NextResponse.json({ success: true });
}

