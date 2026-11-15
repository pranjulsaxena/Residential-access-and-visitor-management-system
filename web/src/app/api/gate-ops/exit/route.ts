import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

/**
 * POST /api/gate-ops/exit
 * Body option A: { entryLogId: string }
 * Body option B: { personId: string, personType: string }
 * Both also accept optional visitId.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const now = new Date();

  // ---- Option A: direct entryLogId ----
  if (body.entryLogId) {
    const entryLog = await db.entryLog.update({
      where: { id: body.entryLogId },
      data: { exitTime: now },
    });

    // Also close associated visit if present
    if (entryLog.visitId) {
      await db.visit.update({
        where: { id: entryLog.visitId },
        data: { status: "exited", exitedAt: now },
      });
    }

    if (body.visitId) {
      await db.visit.update({
        where: { id: body.visitId },
        data: { status: "exited", exitedAt: now },
      });
    }

    return NextResponse.json({ success: true, exitTime: now });
  }

  // ---- Option B: find most recent open entry by personId + personType ----
  if (body.personId && body.personType) {
    const entry = await db.entryLog.findFirst({
      where: { personId: body.personId, personType: body.personType, exitTime: null },
      orderBy: { entryTime: "desc" },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "No active entry found for this person" },
        { status: 404 }
      );
    }

    await db.entryLog.update({ where: { id: entry.id }, data: { exitTime: now } });

    if (entry.visitId) {
      await db.visit.update({
        where: { id: entry.visitId },
        data: { status: "exited", exitedAt: now },
      });
    }

    return NextResponse.json({ success: true, entryLogId: entry.id, exitTime: now });
  }

  return NextResponse.json(
    { error: "Provide either entryLogId or personId+personType" },
    { status: 400 }
  );
}
