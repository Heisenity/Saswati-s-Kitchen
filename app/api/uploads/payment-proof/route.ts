import { NextResponse } from "next/server";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { createPresignedR2Upload, paymentProofUploadOptions, uploadPaymentProof } from "@/lib/storage";

export const runtime = "nodejs";

function buildAnalysis(contentType: string, size: number) {
  return {
    verdict: "NEEDS_MANUAL_REVIEW" as const,
    confidence: 0.5,
    summary: "Attachment received",
    reasons: ["Customer uploaded a payment proof attachment."],
    mimeType: contentType,
    fileSizeKb: Math.round((size / 1024) * 10) / 10
  };
}

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
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        throw new Error("Missing payment screenshot.");
      }

      const url = await uploadPaymentProof(file);
      return NextResponse.json({
        ok: true,
        url,
        analysis: buildAnalysis(file.type, file.size)
      });
    }

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
    return NextResponse.json({ ok: true, ...upload, analysis: buildAnalysis(contentType, size) });
  } catch (error) {
    console.error("[payment-proof:upload-failed]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown upload error"
    });
    return NextResponse.json(
      { ok: false, error: "We could not upload your payment screenshot. Please try another JPG, PNG, or WebP image under 5 MB." },
      { status: 400 }
    );
  }
}
