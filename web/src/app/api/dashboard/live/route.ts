import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/dashboard/live — who is currently inside the society
export async function GET() {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inside = await db.entryLog.findMany({
    where: {
      entryTime: { gte: today },
      exitTime: null, // still inside
    },
    include: {
      gate: { select: { name: true } },
      guard: { select: { name: true } },
      resident: { select: { name: true, flat: { select: { flatNumber: true } } } },
      visit: {
        include: {
          visitor: { select: { name: true, phone: true } },
          flat: { select: { flatNumber: true } },
        },
      },
    },
    orderBy: { entryTime: "desc" },
  });

  return NextResponse.json(inside);
}
