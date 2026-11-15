import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/staff/[id]/face — enroll face for a staff member
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const { id } = await params;

  const staff = await db.staff.findUnique({ where: { id } });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });

  // Save photo
  const uploadDir = path.join(process.cwd(), "..", "uploads", "faces", "staff");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${id}_${Date.now()}.jpg`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Get embedding from AI
  const aiForm = new FormData();
  aiForm.append("file", new Blob([buffer], { type: file.type }), filename);

  let embedding: number[];
  try {
    const result = await callAI("/face/embed", aiForm);
    if (!result.embedding) {
      return NextResponse.json({ error: "No face detected in photo" }, { status: 422 });
    }
    embedding = result.embedding;
  } catch (err) {
    return NextResponse.json(
      { error: `AI service error: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // We need personId for the FaceProfile — use the staff id itself
  const faceProfile = await db.faceProfile.create({
    data: {
      personId: id,
      personType: "staff",
      embedding: JSON.stringify(embedding),
      photoUrl: `/uploads/faces/staff/${filename}`,
    },
  });

  return NextResponse.json({
    success: true,
    faceProfileId: faceProfile.id,
    photoUrl: faceProfile.photoUrl,
  });
}
