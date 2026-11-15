import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { updateFlatSchema } from "@/lib/validators";

// GET /api/flats/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "guard", "resident");
  if (error) return error;

  const { id } = await params;
  const flat = await db.flat.findUnique({
    where: { id },
    include: {
      residents: { where: { status: "active" } },
      staffAssignments: { include: { staff: true } },
    },
  });

  if (!flat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(flat);
}

// PUT /api/flats/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateFlatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const flat = await db.flat.update({ where: { id }, data: parsed.data });
  return NextResponse.json(flat);
}

// DELETE /api/flats/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const { id } = await params;
  await db.flat.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
