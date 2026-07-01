import { NextResponse } from "next/server";
import { applyRateLimit, rejectJson } from "@/lib/security";
import { geocodeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "geocode",
    limit: 20,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  try {
    const body = geocodeSchema.parse(await request.json());
    if (body.address.trim().length < 8) {
      return rejectJson(400, "Enter your full address and try again.");
    }

    return NextResponse.json({
      ok: true,
      manualDeliveryReviewRequired: true
    });
  } catch {
    return rejectJson(400, "Enter your full address and try again.");
  }
}
