import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/gate-ops/identify
 * Guard captures a photo → AI matches face → returns who it is
 * Body: multipart form with `photo` file + `gateId` + `guardId`
 */
export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth("guard");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  const gateId = (formData.get("gateId") as string) || user!.gateId;
  const guardId = (formData.get("guardId") as string) || user!.id;

  if (!file) return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  if (!gateId) return NextResponse.json({ error: "No gateId" }, { status: 400 });

  // Save incoming photo
  const dateStr = new Date().toISOString().split("T")[0];
  const uploadDir = path.join(process.cwd(), "..", "uploads", "entries", dateStr);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}_live.jpg`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  const photoUrl = `/uploads/entries/${dateStr}/${filename}`;

  // Call AI face/match
  const aiForm = new FormData();
  aiForm.append("file", new Blob([buffer], { type: file.type }), filename);

  let matchResult: {
    matched: boolean;
    resident_id?: string;
    face_profile_id?: string;
    similarity?: number;
    person_type?: string;
  };

  try {
    matchResult = await callAI("/face/match", aiForm);
  } catch (err) {
    return NextResponse.json(
      { error: `AI service error: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // --- RESIDENT MATCH → auto-entry ---
  if (matchResult.matched && matchResult.person_type === "resident" && matchResult.resident_id) {
    const resident = await db.resident.findUnique({
      where: { id: matchResult.resident_id },
      include: { flat: true },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident record not found" }, { status: 500 });
    }

    // Create EntryLog automatically
    const entryLog = await db.entryLog.create({
      data: {
        gateId,
        guardId: guardId!,
        personType: "resident",
        personId: resident.id,
        method: "face",
        confidence: matchResult.similarity,
        photoUrl,
      },
    });

    return NextResponse.json({
      action: "auto_entry",
      trust_level: 5,
      person_type: "resident",
      resident: {
        id: resident.id,
        name: resident.name,
        flatNumber: resident.flat.flatNumber,
        building: resident.flat.building,
      },
      similarity: matchResult.similarity,
      entry_log_id: entryLog.id,
      photo_url: photoUrl,
    });
  }

  // --- STAFF MATCH → check time window ---
  if (matchResult.matched && matchResult.person_type === "staff" && matchResult.resident_id) {
    // For staff, resident_id refers to their registeredById (the resident who registered them)
    // We need to find the staff by face profile
    const faceProfile = await db.faceProfile.findUnique({
      where: { id: matchResult.face_profile_id },
      include: {
        staff: {
          include: {
            registeredBy: { select: { name: true, flat: { select: { flatNumber: true } } } },
          },
        },
      },
    });

    const now = new Date();
    const hour = now.getHours();
    const isWorkingHours = hour >= 6 && hour <= 22; // Basic time window

    if (isWorkingHours) {
      const entryLog = await db.entryLog.create({
        data: {
          gateId,
          guardId: guardId!,
          personType: "staff",
          personId: faceProfile?.personId ?? matchResult.resident_id,
          method: "face",
          confidence: matchResult.similarity,
          photoUrl,
        },
      });

      return NextResponse.json({
        action: "auto_entry",
        trust_level: 4,
        person_type: "staff",
        staff_flat: faceProfile?.staff?.registeredBy?.flat?.flatNumber,
        similarity: matchResult.similarity,
        entry_log_id: entryLog.id,
        photo_url: photoUrl,
      });
    } else {
      return NextResponse.json({
        action: "escalate",
        trust_level: 2,
        person_type: "staff",
        reason: "Outside working hours",
        photo_url: photoUrl,
      });
    }
  }

  // --- NO MATCH → collect visitor info ---
  return NextResponse.json({
    action: "collect_info",
    trust_level: 1,
    person_type: "unknown",
    photo_url: photoUrl,
    message: "Face not recognized. Please collect visitor information.",
  });
}
