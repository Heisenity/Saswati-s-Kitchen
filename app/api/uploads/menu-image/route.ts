import { NextResponse } from "next/server";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { rejectJson, requireTrustedOrigin } from "@/lib/security";
import { createPresignedR2Upload, menuImageUploadOptions } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const { fileName, contentType, size } = await request.json();
    const upload = await createPresignedR2Upload({
      fileName,
      contentType,
      size,
      folder: "menu-images",
      ...menuImageUploadOptions
    });
    return NextResponse.json({ ok: true, ...upload });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }
    console.error("[menu-image:upload-failed]", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown upload error"
    });
    return rejectJson(400, "Could not prepare this upload. Use JPG, PNG, or WebP smaller than 5 MB.");
  }
}
