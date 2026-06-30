import { NextResponse } from "next/server";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { uploadChatAttachment } from "@/lib/storage";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "chat-attachment",
    limit: 20,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return rejectJson(400, "Invalid request");
    }

    const url = await uploadChatAttachment(file, 2 * 1024 * 1024);
    return NextResponse.json({
      ok: true,
      url,
      name: file.name.replace(/[^a-zA-Z0-9._-]+/g, "-"),
      mimeType: file.type
    });
  } catch (error) {
    console.error("[chat-attachment:user-upload-failed]", error);
    return rejectJson(400, "Could not upload the attachment.");
  }
}
