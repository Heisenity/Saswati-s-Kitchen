import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { orderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = orderSchema.parse(await request.json());
    const order = await createOrder(payload);

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      order
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not place order."
      },
      { status: 400 }
    );
  }
}
