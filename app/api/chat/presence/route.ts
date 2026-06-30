import { NextResponse } from "next/server";
import { setCustomerPresence } from "@/lib/chat-service";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { customerPresenceSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "chat-presence",
    limit: 60,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const payload = customerPresenceSchema.parse(await request.json());
    const presence = await setCustomerPresence(payload.chatId, payload.online);

    return NextResponse.json({
      ok: true,
      presence
    });
  } catch {
    return rejectJson(400, "Could not update chat presence.");
  }
}
