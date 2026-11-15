import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// DELETE /api/staff/[id] — soft delete
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const { id } = await params;
  await db.staff.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
