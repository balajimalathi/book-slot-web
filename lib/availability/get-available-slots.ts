import { addMinutes, differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { and, eq, gt, isNull, lt, ne, or } from "drizzle-orm";

import { ORG_WIDE_STAFF_ID } from "@/lib/constants/availability";
import { db } from "@/lib/db/db";
import {
  availability as availabilityTable,
  blackoutDate as blackoutDateTable,
  booking as bookingTable,
  organization as organizationTable,
  service as serviceTable,
} from "@/lib/db/schema";

export class GetAvailableSlotsNotFoundError extends Error {
  readonly kind: "org" | "service" | "staff";

  constructor(kind: "org" | "service" | "staff") {
    super(`getAvailableSlots: ${kind} not found or not allowed`);
    this.name = "GetAvailableSlotsNotFoundError";
    this.kind = kind;
  }
}

function parseYmdParts(date: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) {
    throw new Error("Invalid date format");
  }
  return {
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
  };
}

function parseHhMm(hhmm: string): { h: number; min: number } {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) {
    throw new Error("Invalid time format");
  }
  return { h: Number(m[1]), min: Number(m[2]) };
}

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export type GetAvailableSlotsParams = {
  orgId: string;
  staffId: string;
  serviceId: string;
  /** Calendar date in the organization's timezone (YYYY-MM-DD). */
  date: string;
};

/**
 * Returns bookable start times as HH:mm strings in the organization's timezone.
 */
export async function getAvailableSlots(
  params: GetAvailableSlotsParams,
): Promise<string[]> {
  const { orgId, staffId, serviceId, date } = params;
  const { y, m, d } = parseYmdParts(date);

  const [orgRow] = await db
    .select({
      timezone: organizationTable.timezone,
      bufferMinutes: organizationTable.bufferMinutes,
      minAdvanceHours: organizationTable.minAdvanceHours,
      maxAdvanceDays: organizationTable.maxAdvanceDays,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, orgId))
    .limit(1);

  if (!orgRow) {
    throw new GetAvailableSlotsNotFoundError("org");
  }

  const tz = orgRow.timezone;

  const [svcRow] = await db
    .select({
      organizationId: serviceTable.organizationId,
      durationMinutes: serviceTable.durationMinutes,
      isActive: serviceTable.isActive,
      staffIds: serviceTable.staffIds,
    })
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
    .limit(1);

  if (!svcRow || svcRow.organizationId !== orgId) {
    throw new GetAvailableSlotsNotFoundError("service");
  }

  if (!svcRow.isActive) {
    throw new GetAvailableSlotsNotFoundError("service");
  }

  const staffList = Array.isArray(svcRow.staffIds) ? svcRow.staffIds : [];
  const allowsOrgWideOnly = staffList.length === 0;
  if (
    (allowsOrgWideOnly && staffId !== ORG_WIDE_STAFF_ID) ||
    (!allowsOrgWideOnly && !staffList.includes(staffId))
  ) {
    throw new GetAvailableSlotsNotFoundError("staff");
  }

  const nowUtc = new Date();
  const orgTodayStr = formatInTimeZone(nowUtc, tz, "yyyy-MM-dd");
  const dayDiff = differenceInCalendarDays(
    new Date(`${date}T12:00:00.000Z`),
    new Date(`${orgTodayStr}T12:00:00.000Z`),
  );
  if (dayDiff < 0 || dayDiff > orgRow.maxAdvanceDays) {
    return [];
  }

  const dayStartUtc = fromZonedTime(new Date(y, m - 1, d, 0, 0, 0, 0), tz);
  const dayEndUtc = fromZonedTime(new Date(y, m - 1, d + 1, 0, 0, 0, 0), tz);

  const blackoutRows = await db
    .select({
      startDate: blackoutDateTable.startDate,
      endDate: blackoutDateTable.endDate,
    })
    .from(blackoutDateTable)
    .where(
      and(
        eq(blackoutDateTable.organizationId, orgId),
        or(isNull(blackoutDateTable.staffId), eq(blackoutDateTable.staffId, staffId)),
      ),
    );

  for (const b of blackoutRows) {
    const fromStr = formatInTimeZone(b.startDate, tz, "yyyy-MM-dd");
    const toStr = formatInTimeZone(b.endDate, tz, "yyyy-MM-dd");
    if (date >= fromStr && date <= toStr) {
      return [];
    }
  }

  // Monday = 1 ... Sunday = 7 in org-local ISO week; DB uses 0 = Monday ... 6 = Sunday.
  const noonUtc = fromZonedTime(new Date(y, m - 1, d, 12, 0, 0, 0), tz);
  const isoDow = Number(formatInTimeZone(noonUtc, tz, "i"));
  const weekdayIndex = isoDow - 1;
  if (!Number.isFinite(weekdayIndex) || weekdayIndex < 0 || weekdayIndex > 6) {
    return [];
  }

  const availabilityRows = await db
    .select({
      staffId: availabilityTable.staffId,
      isActive: availabilityTable.isActive,
      startTime: availabilityTable.startTime,
      endTime: availabilityTable.endTime,
    })
    .from(availabilityTable)
    .where(
      and(
        eq(availabilityTable.organizationId, orgId),
        eq(availabilityTable.weekday, weekdayIndex),
        or(eq(availabilityTable.staffId, staffId), eq(availabilityTable.staffId, ORG_WIDE_STAFF_ID)),
      ),
    );

  const staffSpecific = availabilityRows.find((r) => r.staffId === staffId);
  const orgWide = availabilityRows.find((r) => r.staffId === ORG_WIDE_STAFF_ID);
  const dayRow = staffSpecific ?? orgWide;

  if (!dayRow || !dayRow.isActive) {
    return [];
  }

  let windowStartUtc: Date;
  let windowEndUtc: Date;
  try {
    const { h: sh, min: smin } = parseHhMm(dayRow.startTime);
    const { h: eh, min: emin } = parseHhMm(dayRow.endTime);
    windowStartUtc = fromZonedTime(new Date(y, m - 1, d, sh, smin, 0, 0), tz);
    windowEndUtc = fromZonedTime(new Date(y, m - 1, d, eh, emin, 0, 0), tz);
  } catch {
    return [];
  }

  if (windowEndUtc.getTime() <= windowStartUtc.getTime()) {
    return [];
  }

  const minBookableMs =
    nowUtc.getTime() + orgRow.minAdvanceHours * 60 * 60 * 1000;

  const bookingRows = await db
    .select({
      startAt: bookingTable.startAt,
      endAt: bookingTable.endAt,
    })
    .from(bookingTable)
    .where(
      and(
        eq(bookingTable.organizationId, orgId),
        eq(bookingTable.staffId, staffId),
        ne(bookingTable.status, "CANCELLED"),
        lt(bookingTable.startAt, dayEndUtc),
        gt(bookingTable.endAt, dayStartUtc),
      ),
    );

  const bufferMs = orgRow.bufferMinutes * 60 * 1000;
  const blocked = bookingRows.map((b) => ({
    start: b.startAt.getTime(),
    end: b.endAt.getTime() + bufferMs,
  }));

  const duration = svcRow.durationMinutes;
  const slots: string[] = [];
  let slotStart = windowStartUtc;

  while (true) {
    const slotEnd = addMinutes(slotStart, duration);
    if (slotEnd.getTime() > windowEndUtc.getTime()) {
      break;
    }

    if (slotStart.getTime() < minBookableMs) {
      slotStart = addMinutes(slotStart, duration);
      continue;
    }

    const s = slotStart.getTime();
    const e = slotEnd.getTime();
    const clashes = blocked.some((b) => intervalsOverlap(s, e, b.start, b.end));

    if (!clashes) {
      slots.push(formatInTimeZone(slotStart, tz, "HH:mm"));
    }

    slotStart = addMinutes(slotStart, duration);
  }

  return [...new Set(slots)].sort();
}
