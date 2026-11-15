import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/visits/[id]/approve
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth("resident", "secretary");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const notes = body.notes as string | undefined;

  // Update approval + visit in a transaction
  const result = await db.$transaction(async (tx) => {
    // Find the approval for this resident
    const approval = await tx.approval.findFirst({
      where: { visitId: id, residentId: user!.id },
    });

    if (!approval) {
      throw new Error("Approval not found or not yours");
    }

    const updatedApproval = await tx.approval.update({
      where: { id: approval.id },
      data: { status: "approved", note: notes, respondedAt: new Date() },
    });

    const updatedVisit = await tx.visit.update({
      where: { id },
      data: { status: "approved" },
    });

    return { approval: updatedApproval, visit: updatedVisit };
  });

  return NextResponse.json(result);
}
