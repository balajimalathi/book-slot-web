import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import {
  organization as organizationTable,
  organizationMember as organizationMemberTable,
} from "@/lib/db/schema";
import { OrganizationOnboardingSchema } from "@/lib/validations/organization-onboarding";

// Updated SKN-15: org-only onboarding (no service/hours creation yet).
const CreateOrgOnlySchema = z.object({
  businessName: OrganizationOnboardingSchema.shape.name,
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  slug: OrganizationOnboardingSchema.shape.slug,
  // We currently treat timezone as fixed UTC globally.
  timezone: z.literal("UTC").default("UTC"),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateOrgOnlySchema.parse(body);

  const orgId = parsed.slug;
  const userId = session.user.id;
  const now = new Date();

  const existingOrg = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    .limit(1);

  if (existingOrg.length === 0) {
    // Organization table has required fields that are not yet part of the
    // org-only onboarding UI; use safe defaults for now.
    await db.insert(organizationTable).values({
      id: orgId,
      name: parsed.businessName,
      email: parsed.email,
      phone: parsed.phone,
      slug: parsed.slug,
      timezone: parsed.timezone,

      currency: "INR",
      minAdvanceHours: 0,
      maxAdvanceDays: 365,
      bufferMinutes: 0,
      cancellationPolicyHours: 24,
      paymentGateway: "RAZORPAY",

      logoUrl: null,
      primaryColor: null,
      bookingHeadline: null,

      razorpayKeyId: null,
      razorpayKeySecret: null,
      dodopayClientId: null,
      dodopayClientSecret: null,

      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(organizationTable)
      .set({
        name: parsed.businessName,
        slug: parsed.slug,
        email: parsed.email,
        phone: parsed.phone,
        timezone: parsed.timezone,
        updatedAt: now,
      })
      .where(eq(organizationTable.id, orgId));
  }

  // Single org per user: replace membership mapping.
  await db
    .delete(organizationMemberTable)
    .where(eq(organizationMemberTable.userId, userId));

  await db.insert(organizationMemberTable).values({
    id: randomUUID(),
    organizationId: orgId,
    userId,
    role: role ?? "admin",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, orgId });
}

