import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@/lib/db-types";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { logAdminAction, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { orderStatusUpdateSchema } from "@/lib/validation";

function handleAdminError(error: unknown) {
  if (error instanceof AdminApiAuthError) {
    return rejectJson(error.status, error.message);
  }

  if (error instanceof ZodError) {
    return rejectJson(400, "Invalid request");
  }

  console.error(error);
  return rejectJson(500, "Could not complete this admin action.");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    if (!isDatabaseConfigured()) {
      return rejectJson(400, "Invalid request");
    }

    const { id } = await params;
    const payload = orderStatusUpdateSchema.parse(await request.json());

    const paymentStatus =
      payload.orderStatus === OrderStatus.REJECTED
        ? PaymentStatus.REJECTED
        : payload.orderStatus === OrderStatus.CONFIRMED ||
            payload.orderStatus === OrderStatus.PREPARING ||
            payload.orderStatus === OrderStatus.OUT_FOR_DELIVERY ||
            payload.orderStatus === OrderStatus.DELIVERED
          ? PaymentStatus.CONFIRMED
          : PaymentStatus.PENDING_VERIFICATION;

    const order = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: payload.orderStatus,
        paymentStatus
      }
    });

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: "order.status.update",
      targetType: "order",
      targetId: order.id,
      metadata: { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus }
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return handleAdminError(error);
  }
}
