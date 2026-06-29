import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { isPrismaConnectionError } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = orderSchema.parse(await request.json());
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to place your order." },
        { status: 401 }
      );
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
    return NextResponse.json(
      {
        ok: false,
        error: isPrismaConnectionError(error)
          ? "Ordering is temporarily unavailable. Please try again in a few minutes."
          : error instanceof Error
            ? error.message
            : "Could not place order."
      },
      { status: 400 }
    );
  }
}
