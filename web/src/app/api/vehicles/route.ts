import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createVehicleSchema } from "@/lib/validators";

// GET /api/vehicles — filter by ?residentId=
export async function GET(req: NextRequest) {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const residentId = req.nextUrl.searchParams.get("residentId");

  const vehicles = await db.vehicle.findMany({
    where: residentId ? { residentId } : {},
    include: {
      resident: { select: { name: true, flat: { select: { flatNumber: true } } } },
    },
    orderBy: { vehicleNumber: "asc" },
  });

  return NextResponse.json(vehicles);
}

// POST /api/vehicles
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const body = await req.json();
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check if plate already registered
  const existing = await db.vehicle.findFirst({
    where: { vehicleNumber: parsed.data.vehicleNumber },
  });
  if (existing) {
    return NextResponse.json({ error: "Vehicle number already registered" }, { status: 409 });
  }

  const vehicle = await db.vehicle.create({ data: parsed.data });
  return NextResponse.json(vehicle, { status: 201 });
}
