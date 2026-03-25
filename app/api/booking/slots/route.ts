import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getAvailableSlots,
  GetAvailableSlotsNotFoundError,
} from "@/lib/availability/get-available-slots";
import {
  BookingSlotsQuerySchema,
  type BookingSlotsQuery,
} from "@/lib/validations/booking-slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = {
    orgId: searchParams.get("orgId") ?? "",
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
