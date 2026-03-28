import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

import {
  getAvailableSlots,
  GetAvailableSlotsNotFoundError,
} from "@/lib/availability/get-available-slots";
import { db } from "@/lib/db/db";
import { organization as organizationTable } from "@/lib/db/schema";
import {
  BookingSlotsQuerySchema,
  type BookingSlotsQuery,
} from "@/lib/validations/booking-slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgIdOrSlug = searchParams.get("orgId") ?? "";
  let resolvedOrgId = orgIdOrSlug;
  if (orgIdOrSlug) {
    const [orgBySlug] = await db
      .select({ id: organizationTable.id })
      .from(organizationTable)
      .where(eq(organizationTable.slug, orgIdOrSlug))
      .limit(1);
    if (orgBySlug) {
      resolvedOrgId = orgBySlug.id;
    }
  }

  const raw = {
    orgId: resolvedOrgId,
    staffId: searchParams.get("staffId") ?? "",
    serviceId: searchParams.get("serviceId") ?? "",
    date: searchParams.get("date") ?? "",
  };

  let query: BookingSlotsQuery;
  try {
    query = BookingSlotsQuerySchema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      const msg = e.issues.map((x) => x.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    throw e;
  }

  try {
    const slots = await getAvailableSlots(query);
    return NextResponse.json({ slots });
  } catch (e) {
    if (e instanceof GetAvailableSlotsNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
