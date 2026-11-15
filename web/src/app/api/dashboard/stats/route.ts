import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/dashboard/stats
export async function GET() {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalEntriesToday,
    currentlyInside,
    pendingApprovals,
    residentEntries,
    visitorEntries,
    staffEntries,
    unknownEntries,
  ] = await Promise.all([
    db.entryLog.count({
      where: { entryTime: { gte: today, lt: tomorrow } },
    }),
    db.entryLog.count({
      where: { entryTime: { gte: today }, exitTime: null },
    }),
    db.approval.count({ where: { status: "pending" } }),
    db.entryLog.count({ where: { personType: "resident", entryTime: { gte: today, lt: tomorrow } } }),
    db.entryLog.count({ where: { personType: "visitor", entryTime: { gte: today, lt: tomorrow } } }),
    db.entryLog.count({ where: { personType: "staff", entryTime: { gte: today, lt: tomorrow } } }),
    db.entryLog.count({ where: { personType: "unknown", entryTime: { gte: today, lt: tomorrow } } }),
  ]);

  return NextResponse.json({
    totalEntriesToday,
    currentlyInside,
    pendingApprovals,
    entryBreakdown: {
      resident: residentEntries,
      visitor: visitorEntries,
      staff: staffEntries,
      unknown: unknownEntries,
    },
  });
}
