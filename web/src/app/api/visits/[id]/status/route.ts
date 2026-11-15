import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

/**
 * GET /api/visits/[id]/status
 * Guard polls this every 3s to know if resident approved/rejected
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const { id } = await params;

  const visit = await db.visit.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      approvals: {
        select: { status: true, notes: true, respondedAt: true },
        orderBy: { respondedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    visitId: visit.id,
    status: visit.status,
    latestApproval: visit.approvals[0] || null,
  });
}
