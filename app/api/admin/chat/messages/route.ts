import { NextResponse } from "next/server";
import { sendChatMessage } from "@/lib/chat-service";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { rejectJson, requireTrustedOrigin } from "@/lib/security";
import { adminChatMessageSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const payload = adminChatMessageSchema.parse(await request.json());
    const message = await sendChatMessage({
      chatId: payload.chatId,
      message: payload.message,
      clientId: payload.clientId,
      senderType: "ADMIN"
    });

    return NextResponse.json({
      ok: true,
      message
    });
  } catch (error) {
    if (error instanceof AdminApiAuthError) {
      return rejectJson(error.status, error.message);
    }

    return rejectJson(400, "Could not send message right now.");
  }
}
