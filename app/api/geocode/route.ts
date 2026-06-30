import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
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
    const address = [body.address, body.landmark].filter(Boolean).join(", ");
    const result = await geocodeAddress(address);

    if (!result) {
      return rejectJson(404, "We could not find that address yet.");
    }

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return rejectJson(400, "Could not check this address right now.");
  }
}
