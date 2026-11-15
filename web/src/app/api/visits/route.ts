import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createVisitSchema } from "@/lib/validators";

// GET /api/visits — filtered by role
export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth("guard", "resident", "secretary");
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status");
  const flatId = req.nextUrl.searchParams.get("flatId");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  let where: Record<string, unknown> = {};

  if (user!.role === "resident") {
    where = { flatId: user!.flatId };
  } else if (user!.role === "guard") {
    where = { gateId: user!.gateId };
  } else if (flatId) {
    where = { flatId };
  }

  if (status) where.status = status;

  const visits = await db.visit.findMany({
    where,
    include: {
      visitor: true,
      flat: { select: { flatNumber: true, building: true } },
      gate: { select: { name: true } },
      guard: { select: { name: true } },
      approval: {
        include: { resident: { select: { name: true } } },
      },
      impersonationChecks: { select: { result: true, similarityScore: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(visits);
}

// POST /api/visits — guard creates a visit
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const body = await req.json();
  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    gateId, guardId, flatId, purpose, visitType,
    visitorName, visitorPhone,
    photoUrl, vehicleNumber,
  } = parsed.data;

  // Get the primary resident of the flat
  const primaryResident = await db.resident.findFirst({
    where: { flatId, isPrimary: true, status: "active" },
  });

  if (!primaryResident) {
    return NextResponse.json({ error: "No primary resident found for this flat" }, { status: 404 });
  }

  // Create Visitor → Visit → Approval in a transaction
  const result = await db.$transaction(async (tx) => {
    const visitor = await tx.visitor.create({
      data: {
        name: visitorName,
        phone: visitorPhone,
      },
    });

    const visit = await tx.visit.create({
      data: {
        visitorId: visitor.id,
        flatId,
        gateId,
        guardId,
        purpose,
        visitType: visitType || "visitor",
        status: "pending",
        photoUrl,
        vehicleNumber,
      },
    });

    const approval = await tx.approval.create({
      data: {
        visitId: visit.id,
        residentId: primaryResident.id,
        status: "pending",
      },
    });

    return { visitor, visit, approval };
  });

  return NextResponse.json(result, { status: 201 });
}
