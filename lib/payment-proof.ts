import { z } from "zod";

export const paymentProofAnalysisSchema = z.object({
  verdict: z.enum(["LIKELY_PAYMENT_SCREENSHOT", "NEEDS_MANUAL_REVIEW"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(3),
  reasons: z.array(z.string().min(3)).min(1),
  mimeType: z.string().min(3),
  fileSizeKb: z.number().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

export type PaymentProofAnalysis = z.infer<typeof paymentProofAnalysisSchema>;

function readPngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20)
  };
}

function readJpegDimensions(bytes: Uint8Array) {
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const blockLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (blockLength < 2 || offset + blockLength + 2 > bytes.length) break;

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8]
      };
    }

    offset += blockLength + 2;
  }

  return null;
}

function readWebpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30) return null;

  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (chunkType === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }

  if (chunkType === "VP8L" && bytes.length >= 25) {
    const width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
    const height = 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6));
    return { width, height };
  }

  return null;
}

function getImageDimensions(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return readPngDimensions(bytes);
  if (mimeType === "image/jpeg") return readJpegDimensions(bytes);
  if (mimeType === "image/webp") return readWebpDimensions(bytes);
  return null;
}

export function analyzePaymentProofImage(input: {
  bytes: Uint8Array;
  mimeType: string;
  fileSizeBytes: number;
}): PaymentProofAnalysis {
  const dimensions = getImageDimensions(input.bytes, input.mimeType);
  const width = dimensions?.width;
  const height = dimensions?.height;
  const fileSizeKb = Math.round((input.fileSizeBytes / 1024) * 10) / 10;
  const aspectRatio = width && height ? width / height : null;
  const reasons: string[] = [];
  let score = 0.2;

  if (fileSizeKb >= 80 && fileSizeKb <= 5_000) {
    score += 0.2;
    reasons.push("file size looks detailed enough for a real payment screenshot");
  } else if (fileSizeKb < 40) {
    reasons.push("file is unusually small for a clear payment proof");
  } else {
    reasons.push("file size is valid but will still need a manual review");
  }

  if (width && height) {
    if ((width >= 540 && height >= 900) || (width >= 900 && height >= 540)) {
      score += 0.25;
      reasons.push("image resolution matches a likely phone or desktop screenshot");
    } else if (width < 360 || height < 360) {
      reasons.push("image resolution is too small for confident automatic verification");
    } else {
      reasons.push("image resolution is readable but not strongly screenshot-like");
    }

    if (aspectRatio !== null) {
      const looksLikePhoneScreenshot = aspectRatio >= 0.42 && aspectRatio <= 0.65;
      const looksLikeDesktopScreenshot = aspectRatio >= 1.2 && aspectRatio <= 2.4;

      if (looksLikePhoneScreenshot || looksLikeDesktopScreenshot) {
        score += 0.2;
        reasons.push("image shape matches common screenshot proportions");
      } else if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
        reasons.push("square crops need manual review because payment screenshots are rarely square");
      } else {
        reasons.push("image shape is unusual for a payment screenshot");
      }
    }
  } else {
    reasons.push("image dimensions could not be read automatically");
  }

  if (input.mimeType === "image/png") {
    score += 0.15;
    reasons.push("PNG is a common format for UPI screenshots");
  } else {
    score += 0.1;
    reasons.push("uploaded image format is supported");
  }

  const confidence = Number(Math.max(0.12, Math.min(0.98, score)).toFixed(2));
  const verdict =
    confidence >= 0.7 ? "LIKELY_PAYMENT_SCREENSHOT" : "NEEDS_MANUAL_REVIEW";

  return {
    verdict,
    confidence,
    summary:
      verdict === "LIKELY_PAYMENT_SCREENSHOT"
        ? "Likely payment screenshot"
        : "Needs manual review",
    reasons,
    mimeType: input.mimeType,
    fileSizeKb,
    width,
    height
  };
}

export function formatPaymentProofAnalysis(analysis?: PaymentProofAnalysis | null) {
  if (!analysis) return "Not available";

  const confidencePercent = Math.round(analysis.confidence * 100);
  const dimensions =
    analysis.width && analysis.height ? `, ${analysis.width}x${analysis.height}` : "";

  return `${analysis.summary} (${confidencePercent}% confidence, ${analysis.fileSizeKb} KB${dimensions})`;
}
