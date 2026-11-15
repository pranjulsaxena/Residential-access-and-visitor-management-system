import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createEntrySchema } from "@/lib/validators";

/**
 * POST /api/gate-ops/entry
 * Manually create an EntryLog after approval/decision
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const body = await req.json();
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { vehicleNumber, ...data } = parsed.data;

  const entryLog = await db.entryLog.create({
    data: {
      ...data,
      entryTime: new Date(),
      ...(vehicleNumber ? { vehicleNumber } : {}),
    },
  });

  return NextResponse.json({ success: true, entryLogId: entryLog.id }, { status: 201 });
}
