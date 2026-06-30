import { NextResponse } from "next/server";
import { sendChatMessage } from "@/lib/chat-service";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { customerChatMessageSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "chat-message",
    limit: 30,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const payload = customerChatMessageSchema.parse(await request.json());
    const message = await sendChatMessage({
      chatId: payload.chatId,
      customerName: payload.customerName,
      phone: payload.phone,
      message: payload.message,
      clientId: payload.clientId,
      senderType: "CUSTOMER"
    });

    return NextResponse.json({
      ok: true,
      message: payload.clientId ? { ...message, clientId: payload.clientId } : message
    });
  } catch {
    return rejectJson(400, "Could not send message right now.");
  }
}
