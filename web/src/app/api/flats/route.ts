import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createFlatSchema } from "@/lib/validators";

// GET /api/flats — list all flats with resident count
export async function GET() {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const flats = await db.flat.findMany({
    include: {
      residents: {
        where: { status: "active" },
        select: { id: true, name: true, isPrimary: true, role: true },
      },
      _count: { select: { visits: true } },
    },
    orderBy: { flatNumber: "asc" },
  });

  return NextResponse.json(flats);
}

// POST /api/flats — secretary only
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const body = await req.json();
  const parsed = createFlatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const flat = await db.flat.create({ data: parsed.data });
  return NextResponse.json(flat, { status: 201 });
}
