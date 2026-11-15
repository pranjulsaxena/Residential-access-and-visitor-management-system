import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/entries — entry log with filters
export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth("guard", "secretary", "resident");
  if (error) return error;

  const gateId = req.nextUrl.searchParams.get("gateId");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    dateFilter = { gte: start, lt: end };
  }

  const entries = await db.entryLog.findMany({
    where: {
      ...(gateId ? { gateId } : user!.role === "guard" ? { gateId: user!.gateId } : {}),
      ...(dateFilter ? { entryTime: dateFilter } : {}),
    },
    include: {
      gate: { select: { name: true } },
      guard: { select: { name: true } },
      plateScan: { select: { extractedNumber: true, matchedVehicleId: true } },
    },
    orderBy: { entryTime: "desc" },
    take: limit,
  });

  return NextResponse.json(entries);
}
