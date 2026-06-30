import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { isPrismaConnectionError } from "@/lib/prisma";
import { applyRateLimit, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "orders-create",
    limit: 10,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  try {
    const payload = orderSchema.parse(await request.json());
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return rejectJson(401, "Unauthorized");
    }

    const order = await createOrder({
      ...payload,
      userId: user.id
    });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      order
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return rejectJson(400, "Ordering is temporarily unavailable. Please try again shortly.");
    }
    return rejectJson(400, "Invalid request");
  }
}
