import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createResidentSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

// GET /api/residents — filter by ?flatId=
export async function GET(req: NextRequest) {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const flatId = req.nextUrl.searchParams.get("flatId");

  const residents = await db.resident.findMany({
    where: {
      status: "active",
      ...(flatId ? { flatId } : {}),
    },
    include: {
      flat: { select: { flatNumber: true, building: true } },
      faceProfiles: { select: { id: true, createdAt: true } },
      vehicles: true,
    },
    orderBy: { name: "asc" },
  });

  // Never send password hashes to the client
  return NextResponse.json(
    residents.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...safe } = r;
      return safe;
    })
  );
}

// POST /api/residents — secretary only
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const body = await req.json();
  const parsed = createResidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...data } = parsed.data;

  const resident = await db.resident.create({
    data: {
      ...data,
      email: data.email || null,
      passwordHash: password ? await bcrypt.hash(password, 12) : null,
    },
  });

  const { passwordHash: _, ...safe } = resident;
  return NextResponse.json(safe, { status: 201 });
}
