import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { organization as organizationTable } from "@/lib/db/schema";
import { requireOrgAdmin } from "@/lib/auth/require-org-admin";
import { OrganizationCoreSettingsSchema } from "@/lib/validations/organization-core";

const REDACTED_SECRET = "********";

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
      id: organizationTable.id,
      name: organizationTable.name,
      email: organizationTable.email,
      phone: organizationTable.phone,
      logoUrl: organizationTable.logoUrl,
      primaryColor: organizationTable.primaryColor,
      bookingHeadline: organizationTable.bookingHeadline,
      timezone: organizationTable.timezone,
      currency: organizationTable.currency,
      minAdvanceHours: organizationTable.minAdvanceHours,
      maxAdvanceDays: organizationTable.maxAdvanceDays,
      bufferMinutes: organizationTable.bufferMinutes,
      cancellationPolicyHours: organizationTable.cancellationPolicyHours,
      paymentGateway: organizationTable.paymentGateway,
      razorpayKeyId: organizationTable.razorpayKeyId,
      razorpayKeySecret: organizationTable.razorpayKeySecret,
      dodopayClientId: organizationTable.dodopayClientId,
      dodopayClientSecret: organizationTable.dodopayClientSecret,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    ;

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    organization: {
      ...orgRow,
      razorpayKeySecret: orgRow.razorpayKeySecret ? REDACTED_SECRET : null,
      dodopayClientSecret: orgRow.dodopayClientSecret ? REDACTED_SECRET : null,
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

  const parsed = OrganizationCoreSettingsSchema.parse(body);
  const [existingOrg] = await db
    .select({
      razorpayKeySecret: organizationTable.razorpayKeySecret,
      dodopayClientSecret: organizationTable.dodopayClientSecret,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId));

  if (!existingOrg) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const nextRazorpaySecret =
    parsed.razorpayKeySecret === REDACTED_SECRET
      ? existingOrg.razorpayKeySecret
      : (parsed.razorpayKeySecret ?? null);
  const nextDodoSecret =
    parsed.dodopayClientSecret === REDACTED_SECRET
      ? existingOrg.dodopayClientSecret
      : (parsed.dodopayClientSecret ?? null);

  const now = new Date();
  await db
    .update(organizationTable)
    .set({
      name: parsed.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      logoUrl: parsed.logoUrl ?? null,
      primaryColor: parsed.primaryColor ?? null,
      bookingHeadline: parsed.bookingHeadline ?? null,
      currency: parsed.currency,
      minAdvanceHours: parsed.minAdvanceHours,
      maxAdvanceDays: parsed.maxAdvanceDays,
      bufferMinutes: parsed.bufferMinutes,
      cancellationPolicyHours: parsed.cancellationPolicyHours,
      paymentGateway: parsed.paymentGateway ?? "RAZORPAY",
      razorpayKeyId: parsed.razorpayKeyId ?? null,
      razorpayKeySecret: nextRazorpaySecret,
      dodopayClientId: parsed.dodopayClientId ?? null,
      dodopayClientSecret: nextDodoSecret,
      updatedAt: now,
    })
    .where(eq(organizationTable.id, orgId));

  return NextResponse.json({ success: true });
}

