import { NextResponse } from "next/server";
import { getCustomerChatThread, sendChatMessage } from "@/lib/chat-service";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { customerChatMessageSchema, customerChatPollSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "chat-poll",
    limit: 80,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const payload = customerChatPollSchema.parse({
      chatId: searchParams.get("chatId"),
      customerName: searchParams.get("customerName"),
      phone: searchParams.get("phone")
    });
    const chat = await getCustomerChatThread(payload);

    return NextResponse.json({ ok: true, ...chat });
  } catch {
    return rejectJson(400, "Could not refresh this conversation right now.");
  }
}

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
