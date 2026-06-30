import { NextResponse } from "next/server";
import { findOrCreateCustomerChat } from "@/lib/chat-service";
import { getSessionContext } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import {
  isLikelyHumanName,
  isValidIndianMobile,
  normalizeIndianMobile,
  sanitizeHumanName
} from "@/lib/chat";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { customerChatSessionSchema } from "@/lib/validation";

async function resolveChatIdentity(fallback: { customerName: string; phone: string }) {
  const { user, profile } = await getSessionContext();

  if (!user) {
    return {
      customerName: sanitizeHumanName(fallback.customerName),
      phone: normalizeIndianMobile(fallback.phone),
      nameLocked: false,
      phoneLocked: false
    };
  }

  const accountName = sanitizeHumanName(
    profile?.fullName ??
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ??
      fallback.customerName
  );

  const accountPhone =
    normalizeIndianMobile(user.phone ?? "") ||
    normalizeIndianMobile((await getOrdersForUser(user.id))[0]?.phone ?? "") ||
    normalizeIndianMobile(fallback.phone);

  return {
    customerName: accountName,
    phone: accountPhone,
    nameLocked: isLikelyHumanName(accountName),
    phoneLocked: isValidIndianMobile(accountPhone)
  };
}

export async function GET() {
  try {
    const identity = await resolveChatIdentity({ customerName: "", phone: "" });

    return NextResponse.json({
      ok: true,
      ...identity
    });
  } catch {
    return rejectJson(400, "Could not load chat profile.");
  }
}

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "chat-session",
    limit: 20,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const payload = customerChatSessionSchema.parse(await request.json());
    const identity = await resolveChatIdentity(payload);
    const chat = await findOrCreateCustomerChat({
      customerName: identity.customerName,
      phone: identity.phone,
      orderNumber: payload.orderNumber
    });

    return NextResponse.json({
      ok: true,
      ...chat,
      customerName: identity.customerName,
      phone: identity.phone,
      nameLocked: identity.nameLocked,
      phoneLocked: identity.phoneLocked
    });
  } catch {
    return rejectJson(400, "Could not start chat right now.");
  }
}
