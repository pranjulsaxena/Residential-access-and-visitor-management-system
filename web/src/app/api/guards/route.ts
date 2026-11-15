import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createGuardSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

// GET /api/guards
export async function GET() {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const guards = await db.guard.findMany({
    where: { isActive: true },
    include: { assignedGate: { select: { name: true, location: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(guards.map(({ passwordHash: _, ...g }) => g));
}

// POST /api/guards — secretary only
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const body = await req.json();
  const parsed = createGuardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...data } = parsed.data;

  const guard = await db.guard.create({
    data: {
      ...data,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const { passwordHash: _, ...safe } = guard;
  return NextResponse.json(safe, { status: 201 });
}
