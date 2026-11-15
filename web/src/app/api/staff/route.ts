import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createStaffSchema } from "@/lib/validators";

// GET /api/staff — filter by ?registeredById= or ?flatId=
export async function GET(req: NextRequest) {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const registeredById = req.nextUrl.searchParams.get("registeredById");
  const flatId = req.nextUrl.searchParams.get("flatId");

  const staff = await db.staff.findMany({
    where: {
      isActive: true,
      ...(registeredById ? { registeredById } : {}),
      ...(flatId
        ? { flatAssignments: { some: { flatId } } }
        : {}),
    },
    include: {
      registeredBy: { select: { name: true, flat: { select: { flatNumber: true } } } },
      faceProfiles: { select: { id: true, createdAt: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(staff);
}

// POST /api/staff
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const body = await req.json();
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { registeredById, ...staffData } = parsed.data;

  // Get flat of the registering resident
  const registrar = await db.resident.findUnique({
    where: { id: registeredById },
    select: { flatId: true },
  });
  if (!registrar) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  // Create staff + auto-assign to resident's flat
  const staff = await db.staff.create({
    data: {
      name: staffData.name,
      phone: staffData.phone,
      role: staffData.role,
      clearanceLevel: staffData.clearanceLevel || "flat",
      allowedTimeWindow: staffData.allowedTimeWindow ?? undefined,
      registeredById,
      flatAssignments: {
        create: { flatId: registrar.flatId },
      },
    },
    include: { flatAssignments: true },
  });

  return NextResponse.json(staff, { status: 201 });
}
