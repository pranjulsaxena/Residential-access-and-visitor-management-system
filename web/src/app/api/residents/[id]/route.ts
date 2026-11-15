import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { updateResidentSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

// GET /api/residents/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const { id } = await params;
  const resident = await db.resident.findUnique({
    where: { id },
    include: {
      flat: true,
      vehicles: true,
      faceProfiles: { select: { id: true, createdAt: true, personType: true } },
    },
  });

  if (!resident) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _pw, ...safe } = resident;
  return NextResponse.json(safe);
}

// PUT /api/residents/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateResidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...data } = parsed.data;
  const updated = await db.resident.update({
    where: { id },
    data: {
      ...data,
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
  });

  const { passwordHash: _pw2, ...safe2 } = updated;
  return NextResponse.json(safe2);
}
