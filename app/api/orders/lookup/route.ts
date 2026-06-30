import { NextResponse } from "next/server";
import { lookupOrderByPhone } from "@/lib/orders";
import { applyRateLimit, rejectJson } from "@/lib/security";
import { orderLookupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "orders-lookup",
    limit: 12,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  try {
    const payload = orderLookupSchema.parse(await request.json());
    const order = await lookupOrderByPhone(payload.orderNumber, payload.phone);

    if (!order) {
      return rejectJson(404, "No matching order was found for this phone number and order ID.");
    }

    return NextResponse.json({
      ok: true,
      order
    });
  } catch {
    return rejectJson(400, "Invalid request");
  }
}
