import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/gate-ops/scan-id
 * Guard photographs a visitor's ID → AI extracts data
 * Body: multipart form with `photo` file
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No ID photo provided" }, { status: 400 });

  // Save ID photo
  const dateStr = new Date().toISOString().split("T")[0];
  const uploadDir = path.join(process.cwd(), "..", "uploads", "id-scans", dateStr);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}_id.jpg`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  const rawImageUrl = `/uploads/id-scans/${dateStr}/${filename}`;

  // Call AI id/extract
  const aiForm = new FormData();
  aiForm.append("file", new Blob([buffer], { type: file.type }), filename);

  try {
    const result = await callAI("/id/extract", aiForm);
    return NextResponse.json({
      ...result,
      name: result.extracted_data?.name ?? null,
      id_number: result.id_number ?? result.extracted_data?.id_number ?? null,
      rawImageUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `AI service error: ${(err as Error).message}`, rawImageUrl },
      { status: 502 }
    );
  }
}
