import { NextResponse } from "next/server";
import { lookupOrderByPhone } from "@/lib/orders";
import { orderLookupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = orderLookupSchema.parse(await request.json());
    const order = await lookupOrderByPhone(payload.orderNumber, payload.phone);

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error: "No matching order was found for this phone number and order ID."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      order
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not look up order."
      },
      { status: 400 }
    );
  }
}
