import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/gate-ops/scan-plate
 * Guard photographs a vehicle plate → AI reads it → check DB for owner
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No plate photo provided" }, { status: 400 });

  // Save plate photo
  const dateStr = new Date().toISOString().split("T")[0];
  const uploadDir = path.join(process.cwd(), "..", "uploads", "plates", dateStr);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}_plate.jpg`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  const plateImageUrl = `/uploads/plates/${dateStr}/${filename}`;

  // Call AI plate/read
  const aiForm = new FormData();
  aiForm.append("file", new Blob([buffer], { type: file.type }), filename);

  let plateResult: { plate_number?: string; confidence?: number; normalized?: string };
  try {
    plateResult = await callAI("/plate/read", aiForm);
  } catch (err) {
    return NextResponse.json(
      { error: `AI service error: ${(err as Error).message}`, plateImageUrl },
      { status: 502 }
    );
  }

  if (!plateResult.plate_number) {
    return NextResponse.json({
      matched: false,
      plate_number: null,
      message: "Could not read plate number",
      plateImageUrl,
    });
  }

  // Look up plate in Vehicle table
  const vehicle = await db.vehicle.findFirst({
    where: { vehicleNumber: plateResult.normalized || plateResult.plate_number },
    include: {
      resident: {
        select: { name: true, flat: { select: { flatNumber: true, building: true } } },
      },
    },
  });

  return NextResponse.json({
    matched: !!vehicle,
    plate_number: plateResult.plate_number,
    normalized: plateResult.normalized,
    confidence: plateResult.confidence,
    plateImageUrl,
    vehicle: vehicle
      ? {
          id: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          type: vehicle.vehicleType,
          make: vehicle.make,
          owner: {
            name: vehicle.resident.name,
            flatNumber: vehicle.resident.flat.flatNumber,
            building: vehicle.resident.flat.building,
          },
        }
      : null,
  });
}
