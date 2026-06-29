import { randomUUID } from "crypto";
import { PaymentStatus, type SlotType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { calculateDeliveryCharge, haversineDistanceKm } from "@/lib/delivery";
import { assertSlotAvailable } from "@/lib/slot";
import { sendNewOrderNotification, sendPaymentProofNotification } from "@/lib/notifications";
import { isDatabaseConfigured } from "@/lib/env";

export type CheckoutItemInput = {
  menuItemId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderInput = {
  checkoutToken: string;
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  slotType: SlotType;
  items: CheckoutItemInput[];
  paymentUtr?: string;
  paymentScreenshotUrl?: string;
};

export function buildOrderNumber() {
  return `SK-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function getAdvanceAmount(total: number) {
  return Math.ceil(total / 2);
}

export async function createOrder(input: CreateOrderInput) {
  if (!isDatabaseConfigured()) {
    return {
      orderNumber: buildOrderNumber(),
      totalAmount: input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      advanceAmount: 0,
      balanceAmount: 0
    };
  }

  const existing = await prisma.order.findUnique({
    where: { checkoutToken: input.checkoutToken }
  });
  if (existing) return existing;

  const settings = await getSettings();
  assertSlotAvailable(settings, input.slotType);

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const distanceKm =
    input.latitude && input.longitude
      ? haversineDistanceKm(
          { lat: settings.kitchenLatitude, lng: settings.kitchenLongitude },
          { lat: input.latitude, lng: input.longitude }
        )
      : 0;

  const deliveryCharge = calculateDeliveryCharge({
    subtotal,
    distanceKm,
    freeDeliveryOneKmMin: settings.freeDeliveryOneKmMin,
    freeDeliveryTwoKmMin: settings.freeDeliveryTwoKmMin,
    aboveTwoKmDeliveryCharge: settings.aboveTwoKmDeliveryCharge,
    lowOrderDeliveryCharge: settings.lowOrderDeliveryCharge
  });
  const totalAmount = subtotal + deliveryCharge;
  const advanceAmount = getAdvanceAmount(totalAmount);
  const balanceAmount = totalAmount - advanceAmount;
  const orderNumber = buildOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      checkoutToken: input.checkoutToken || randomUUID(),
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      landmark: input.landmark,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceKm,
      slotType: input.slotType,
      subtotal,
      deliveryCharge,
      totalAmount,
      advanceAmount,
      balanceAmount,
      paymentStatus: PaymentStatus.PENDING_VERIFICATION,
      paymentUtr: input.paymentUtr,
      paymentScreenshotUrl: input.paymentScreenshotUrl,
      items: {
        create: input.items.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      },
      paymentProof:
        input.paymentScreenshotUrl && input.paymentUtr
          ? {
              create: {
                screenshotUrl: input.paymentScreenshotUrl,
                utr: input.paymentUtr
              }
            }
          : undefined
    },
    include: {
      items: true
    }
  });

  await sendNewOrderNotification(order);
  if (input.paymentScreenshotUrl) await sendPaymentProofNotification(order);
  return order;
}
