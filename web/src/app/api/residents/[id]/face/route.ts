import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/residents/[id]/face — enroll face for a resident
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const { id } = await params;

  // Confirm resident exists
  const resident = await db.resident.findUnique({ where: { id } });
  if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });

  // Save photo to disk
  const uploadDir = path.join(process.cwd(), "..", "uploads", "faces", "residents");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${id}_${Date.now()}.jpg`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Call AI service to get embedding
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

  // Store face profile in DB
  const faceProfile = await db.faceProfile.create({
    data: {
      personId: id,
      personType: "resident",
      embedding: JSON.stringify(embedding),
      photoUrl: `/uploads/faces/residents/${filename}`,
    },
  });

  return NextResponse.json({
    success: true,
    faceProfileId: faceProfile.id,
    photoUrl: faceProfile.photoUrl,
  });
}

// GET /api/residents/[id]/face — list face profiles for a resident
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary", "resident");
  if (error) return error;

  const { id } = await params;
  const profiles = await db.faceProfile.findMany({
    where: { personId: id, personType: "resident" },
    select: { id: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
}

// DELETE /api/residents/[id]/face — remove all face profiles
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("secretary");
  if (error) return error;

  const { id } = await params;
  await db.faceProfile.deleteMany({ where: { personId: id, personType: "resident" } });
  return NextResponse.json({ success: true });
}
