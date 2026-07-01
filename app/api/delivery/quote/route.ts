import { NextResponse } from "next/server";
import { applyRateLimit, requireTrustedOrigin } from "@/lib/security";
import { geocodeSchema } from "@/lib/validation";

const manualReviewMessage =
  "Prefer not to share live location? You can place the order now with just the meal advance. Our team will confirm delivery charges manually after checkout.";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "delivery-quote",
    limit: 20,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const body = geocodeSchema.parse(await request.json());
    if (body.address.trim().length < 8) {
      return NextResponse.json(
        { ok: false, error: "Enter your full address and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "MANUAL_REVIEW",
      deliveryCharge: 0,
      manualDeliveryReviewRequired: true,
      message: manualReviewMessage
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Enter your full address and try again." },
      { status: 400 }
    );
  }
}
