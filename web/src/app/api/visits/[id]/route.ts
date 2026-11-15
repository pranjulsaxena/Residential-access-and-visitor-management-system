import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/visits/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("guard", "resident", "secretary");
  if (error) return error;

  const { id } = await params;

  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      visitor: true,
      flat: { select: { flatNumber: true, building: true } },
      gate: { select: { name: true, location: true } },
      guard: { select: { name: true } },
      approval: {
        include: { resident: { select: { name: true, phone: true } } },
      },
      impersonationChecks: true,
      idDocuments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(visit);
}
