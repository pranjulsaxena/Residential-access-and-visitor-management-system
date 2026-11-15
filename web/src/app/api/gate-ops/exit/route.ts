import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

/**
 * POST /api/gate-ops/exit
 * Mark an entry log as exited
 * Body: { entryLogId: string, visitId?: string }
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const { entryLogId, visitId } = await req.json();
  if (!entryLogId) {
    return NextResponse.json({ error: "entryLogId required" }, { status: 400 });
  }

  const now = new Date();

  const [entryLog] = await Promise.all([
    db.entryLog.update({
      where: { id: entryLogId },
      data: { exitTime: now },
    }),
    visitId
      ? db.visit.update({ where: { id: visitId }, data: { status: "exited", exitedAt: now } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ success: true, exitTime: entryLog.exitTime });
}
