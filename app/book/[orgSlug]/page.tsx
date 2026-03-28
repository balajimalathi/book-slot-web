import { notFound } from "next/navigation";

import { PublicBookingClient } from "@/app/book/[orgSlug]/_components/public-booking-client";
import { db } from "@/lib/db/db";
import {
  organization as organizationTable,
  service as serviceTable,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

type PublicOrgResponse = {
  organization: {
    id: string;
    slug: string;
    name: string;
    bookingHeadline: string | null;
    timezone: string;
    currency: string;
    paymentGateway: "RAZORPAY" | "DODOPAYMENTS";
  };
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: string;
    depositAmount: string | null;
    currency: string;
    staffIds: string[];
  }>;
};

export default async function PublicBookingOrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
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
    notFound();
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
      and(eq(serviceTable.organizationId, orgRow.id), eq(serviceTable.isActive, true)),
    )
    .orderBy(serviceTable.createdAt);

  const data: PublicOrgResponse = {
    organization: {
      ...orgRow,
      paymentGateway:
        orgRow.paymentGateway === "DODOPAYMENTS" ? "DODOPAYMENTS" : "RAZORPAY",
    },
    services: serviceRows.map((service) => ({
      ...service,
      staffIds: Array.isArray(service.staffIds) ? service.staffIds : [],
    })),
  };

  return (
    <main className="container mx-auto min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <PublicBookingClient org={data.organization} services={data.services} />
      </div>
    </main>
  );
}
