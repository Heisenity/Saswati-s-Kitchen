import { randomUUID } from "crypto";
import { OrderStatus, PaymentStatus, type SlotType } from "@/lib/db-types";
import { geocodeAddress } from "@/lib/geocode";
import { isPrismaConnectionError, isPrismaSchemaMismatchError, prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { MAX_DELIVERY_DISTANCE_KM, calculateDeliveryCharge, haversineDistanceKm } from "@/lib/delivery";
import type { PaymentProofAnalysis } from "@/lib/payment-proof";
import { assertSlotAvailable } from "@/lib/slot";
import { sendNewOrderNotification, sendPaymentProofNotification } from "@/lib/notifications";
import { isDatabaseConfigured } from "@/lib/env";
import { matchesPhone, normalizePhone } from "@/lib/phone";

export type CheckoutItemInput = {
  menuItemId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderInput = {
  checkoutToken: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  slotType: SlotType;
  items: CheckoutItemInput[];
  paymentScreenshotUrl?: string;
  paymentProofAnalysis?: PaymentProofAnalysis;
};

export function buildOrderNumber() {
  return `SK-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function getAdvanceAmount(total: number) {
  return Math.ceil(total / 2);
}

async function resolveCustomerCoordinates(input: CreateOrderInput) {
  if (input.latitude && input.longitude) {
    return { latitude: input.latitude, longitude: input.longitude };
  }

  return geocodeAddress([input.address, input.landmark].filter(Boolean).join(", "));
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

  const normalizedPhone = normalizePhone(input.phone);
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const customerCoordinates = await resolveCustomerCoordinates(input);
  if (!customerCoordinates) {
    throw new Error("Please use Locate Me or enter a more complete delivery address.");
  }

  const distanceKm = haversineDistanceKm(
    { lat: settings.kitchenLatitude, lng: settings.kitchenLongitude },
    { lat: customerCoordinates.latitude, lng: customerCoordinates.longitude }
  );
  if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
    throw new Error("We are coming soon to your location.");
  }

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
  const isPaid = Boolean(input.paymentScreenshotUrl);

  const orderData = {
    orderNumber,
    checkoutToken: input.checkoutToken || randomUUID(),
    userId: input.userId,
    customerName: input.customerName,
    phone: normalizedPhone,
    address: input.address,
    landmark: input.landmark,
    latitude: customerCoordinates.latitude,
    longitude: customerCoordinates.longitude,
    distanceKm,
    slotType: input.slotType,
    subtotal,
    deliveryCharge,
    totalAmount,
    advanceAmount,
    balanceAmount,
    paymentStatus: isPaid ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING_VERIFICATION,
    orderStatus: isPaid
      ? OrderStatus.CONFIRMED
      : OrderStatus.PAYMENT_PENDING_VERIFICATION,
    paymentScreenshotUrl: input.paymentScreenshotUrl,
    items: {
      create: input.items.map((item) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }))
    }
  };

  let order;
  try {
    order = await prisma.order.create({
      data: orderData,
      include: {
        items: true
      }
    });
  } catch (error) {
    if (input.userId && isPrismaSchemaMismatchError(error)) {
      // ponytail: old DBs may still miss Order.userId; retry without account-linking until migration is applied
      const { userId: _userId, ...legacyOrderData } = orderData;
      order = await prisma.order.create({
        data: legacyOrderData,
        include: {
          items: true
        }
      });
    } else {
      throw error;
    }
  }

  await sendNewOrderNotification(order);
  if (input.paymentScreenshotUrl) {
    await sendPaymentProofNotification(order, input.paymentProofAnalysis);
  }
  return order;
}

export async function getOrdersForUser(userId: string) {
  if (!isDatabaseConfigured()) return [];

  try {
    return await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 12
    });
  } catch (error) {
    if (isPrismaConnectionError(error) || isPrismaSchemaMismatchError(error)) return [];
    throw error;
  }
}

export async function lookupOrderByPhone(orderNumber: string, phone: string) {
  if (!isDatabaseConfigured()) return null;

  let order;
  try {
    order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) return null;
    throw error;
  }

  if (!order || !matchesPhone(order.phone, phone)) return null;
  return order;
}
