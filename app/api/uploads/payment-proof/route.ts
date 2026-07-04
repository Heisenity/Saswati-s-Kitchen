import { NextResponse } from "next/server";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { createPresignedR2Upload, paymentProofUploadOptions } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "payment-proof-upload",
    limit: 10,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const { fileName, contentType, size } = await request.json();
    const upload = await createPresignedR2Upload({
      fileName,
      contentType,
      size,
      folder: "payment-proofs",
      maxBytes: paymentProofUploadOptions.maxBytes,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      allowedExtensions: ["jpg", "jpeg", "png", "webp"]
    });
    const analysis = {
      verdict: "NEEDS_MANUAL_REVIEW" as const,
      confidence: 0.5,
      summary: "Attachment received",
      reasons: ["Customer uploaded a payment proof attachment."],
      mimeType: contentType,
      fileSizeKb: Math.round((size / 1024) * 10) / 10
    };
    return NextResponse.json({ ok: true, ...upload, analysis });
  } catch (error) {
    console.error("[payment-proof:upload-failed]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown upload error"
    });
    return NextResponse.json(
      { ok: false, error: "Could not prepare payment screenshot upload." },
      { status: 400 }
    );
  }
}
