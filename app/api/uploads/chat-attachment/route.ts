import { NextResponse } from "next/server";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { rejectJson, requireTrustedOrigin } from "@/lib/security";
import { uploadChatAttachment } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return rejectJson(400, "Invalid request");
    }

    const url = await uploadChatAttachment(file);
    return NextResponse.json({
      ok: true,
      url,
      name: file.name.replace(/[^a-zA-Z0-9._-]+/g, "-"),
      mimeType: file.type
    });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }
    return rejectJson(400, "Invalid upload");
  }
}
