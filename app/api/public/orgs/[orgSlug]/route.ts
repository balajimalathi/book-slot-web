import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db/db";
import {
  organization as organizationTable,
  service as serviceTable,
} from "@/lib/db/schema";
import { PublicOrgBookingDataSchema } from "@/lib/validations/public-booking";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;

  const [orgRow] = await db
    .select({
      id: organizationTable.id,
      slug: organizationTable.slug,
      name: organizationTable.name,
      bookingHeadline: organizationTable.bookingHeadline,
      timezone: organizationTable.timezone,
      currency: organizationTable.currency,
      paymentGateway: organizationTable.paymentGateway,
    })
    .from(organizationTable)
    .where(eq(organizationTable.slug, orgSlug))
    .limit(1);

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const serviceRows = await db
    .select({
      id: serviceTable.id,
      name: serviceTable.name,
      description: serviceTable.description,
      durationMinutes: serviceTable.durationMinutes,
      price: serviceTable.price,
      depositAmount: serviceTable.depositAmount,
      currency: serviceTable.currency,
      staffIds: serviceTable.staffIds,
    })
    .from(serviceTable)
    .where(
      and(
        eq(serviceTable.organizationId, orgRow.id),
        eq(serviceTable.isActive, true),
      ),
    )
    .orderBy(serviceTable.createdAt);

  const payload = PublicOrgBookingDataSchema.parse({
    organization: {
      ...orgRow,
      paymentGateway:
        orgRow.paymentGateway === "DODOPAYMENTS" ? "DODOPAYMENTS" : "RAZORPAY",
    },
    services: serviceRows.map((service) => ({
      ...service,
      staffIds: Array.isArray(service.staffIds) ? service.staffIds : [],
    })),
  });

  return NextResponse.json(payload);
}
