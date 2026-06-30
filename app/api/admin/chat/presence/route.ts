import { NextResponse } from "next/server";
import { requireStrictAdminApiSession, AdminApiAuthError } from "@/lib/auth";
import { setAdminPresence } from "@/lib/chat-service";
import { rejectJson, requireTrustedOrigin } from "@/lib/security";
import { adminPresenceSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const payload = adminPresenceSchema.parse(await request.json());
    const online = await setAdminPresence(admin.user.id, payload.online);

    return NextResponse.json({
      ok: true,
      online
    });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }

    return rejectJson(400, "Could not update admin presence.");
  }
}
