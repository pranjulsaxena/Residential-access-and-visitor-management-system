import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { callAI } from "@/lib/ai-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/gate-ops/check-impersonation
 * Compare visitor's live face with their ID photo to detect impersonation.
 * Note: ImpersonationCheck requires an idDocumentId FK.
 * We skip DB saving here since we may not have an idDocument yet.
 * The gate-ops UI should save to DB after creating the IdDocument.
 *
 * Body: multipart with `livePhoto` + `idPhoto`
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth("guard");
  if (error) return error;

  const formData = await req.formData();
  const liveFile = formData.get("livePhoto") as File | null;
  const idFile = formData.get("idPhoto") as File | null;

  if (!liveFile || !idFile) {
    return NextResponse.json({ error: "Both livePhoto and idPhoto are required" }, { status: 400 });
  }

  const liveBuffer = Buffer.from(await liveFile.arrayBuffer());
  const idBuffer = Buffer.from(await idFile.arrayBuffer());

  // Save photos for record
  const dateStr = new Date().toISOString().split("T")[0];
  const uploadDir = path.join(process.cwd(), "..", "uploads", "impersonation", dateStr);
  await mkdir(uploadDir, { recursive: true });

  const ts = Date.now();
  const liveFilename = `${ts}_live.jpg`;
  const idFilename = `${ts}_id.jpg`;

  await Promise.all([
    writeFile(path.join(uploadDir, liveFilename), liveBuffer),
    writeFile(path.join(uploadDir, idFilename), idBuffer),
  ]);

  // Call AI face/compare with TWO files
  const aiForm = new FormData();
  aiForm.append("file1", new Blob([liveBuffer], { type: liveFile.type }), "live.jpg");
  aiForm.append("file2", new Blob([idBuffer], { type: idFile.type }), "id.jpg");

  let compareResult: { match: boolean; similarity: number; threshold: number };
  try {
    compareResult = await callAI("/face/compare", aiForm);
  } catch (err) {
    return NextResponse.json(
      { error: `AI service error: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    match: compareResult.match,
    similarity: compareResult.similarity,
    threshold: compareResult.threshold,
    is_impersonation: !compareResult.match,
    risk_level: !compareResult.match ? "HIGH" : compareResult.similarity > 0.7 ? "LOW" : "MEDIUM",
    // Photo URLs to pass back for saving with IdDocument
    livePhotoUrl: `/uploads/impersonation/${dateStr}/${liveFilename}`,
    idPhotoUrl: `/uploads/impersonation/${dateStr}/${idFilename}`,
  });
}
