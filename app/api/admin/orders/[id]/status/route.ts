import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 400 });
  }

  const { id } = await params;
  const { orderStatus } = await request.json();

  const paymentStatus =
    orderStatus === OrderStatus.REJECTED
      ? PaymentStatus.REJECTED
      : orderStatus === OrderStatus.CONFIRMED ||
          orderStatus === OrderStatus.PREPARING ||
          orderStatus === OrderStatus.OUT_FOR_DELIVERY ||
          orderStatus === OrderStatus.DELIVERED
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.PENDING_VERIFICATION;

  const order = await prisma.order.update({
    where: { id },
    data: {
      orderStatus,
      paymentStatus
    }
  });

  return NextResponse.json({ ok: true, order });
}
