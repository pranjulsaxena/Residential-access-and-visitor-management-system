import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

/**
 * GET /api/visits/pending
 * Resident sees their own pending approval requests
 */
export async function GET(_: NextRequest) {
  const { error, user } = await requireAuth("resident", "secretary");
  if (error) return error;

  const approvals = await db.approval.findMany({
    where: {
      residentId: user!.id,
      status: "pending",
    },
    include: {
      visit: {
        include: {
          visitor: true,
          gate: { select: { name: true } },
          guard: { select: { name: true } },
          flat: { select: { flatNumber: true } },
          impersonationChecks: { select: { result: true, similarityScore: true } },
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(approvals);
}
