import { randomUUID } from "crypto";
import { OrderStatus, PaymentStatus, type SlotType } from "@/lib/db-types";
import { isPrismaConnectionError, isPrismaSchemaMismatchError, prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { MAX_DELIVERY_DISTANCE_KM, calculateDeliveryCharge, haversineDistanceKm } from "@/lib/delivery";
import type { PaymentProofAnalysis } from "@/lib/payment-proof";
import { assertSlotAvailable } from "@/lib/slot";
import { isDatabaseConfigured } from "@/lib/env";
import { matchesPhone, normalizePhone } from "@/lib/phone";
import { getMenuItems } from "@/lib/menu";
import { sanitizeCustomization } from "@/lib/cart-customization";

export type CheckoutItemInput = {
  menuItemId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  customization?: string;
};

export type CreateOrderInput = {
  checkoutToken: string;
  quoteId?: string;
  quoteToken?: string;
  manualDeliveryReviewRequired?: boolean;
  deliveryChargeStatus?: "PENDING_ADMIN_REVIEW";
  geocodeProvider?: string;
  locationConfidence?: number;
  userId?: string;
  customerName: string;
  customerEmail: string;
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

async function resolveCustomerCoordinates(
  input: CreateOrderInput
) {
  if (input.latitude && input.longitude) {
    return { latitude: input.latitude, longitude: input.longitude };
  }

  return null;
}

export async function createOrder(input: CreateOrderInput) {
  const menuItems = await getMenuItems();
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const resolvedItems = input.items.map((item) => {
    const canonical = item.menuItemId ? menuById.get(item.menuItemId) : null;
    if (!canonical) throw new Error("One of the cart items is no longer available. Please refresh your cart.");
    return {
      menuItemId: canonical.id,
      itemName: canonical.name,
      quantity: item.quantity,
      unitPrice: canonical.price,
      customization: sanitizeCustomization(canonical.name, item.customization)
    };
  });

  if (!isDatabaseConfigured()) {
    return {
      orderNumber: buildOrderNumber(),
      totalAmount: resolvedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
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
  const subtotal = resolvedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const manualDeliveryReviewRequired = Boolean(
    input.manualDeliveryReviewRequired &&
      !input.quoteId &&
      !input.quoteToken &&
      !(input.latitude && input.longitude)
  );

  let customerCoordinates: Awaited<ReturnType<typeof resolveCustomerCoordinates>> | null = null;
  let distanceKm: number | null = null;
  let deliveryCharge = 0;

  if (!manualDeliveryReviewRequired) {
    customerCoordinates = await resolveCustomerCoordinates(input);
    if (!customerCoordinates) {
      throw new Error("Please tap Locate Me for exact delivery charges or continue with your typed address.");
    }

    distanceKm = haversineDistanceKm(
      { lat: settings.kitchenLatitude, lng: settings.kitchenLongitude },
      { lat: customerCoordinates.latitude, lng: customerCoordinates.longitude }
    );
    if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
      throw new Error("We are coming soon to your location.");
    }

    deliveryCharge = calculateDeliveryCharge({
      subtotal,
      distanceKm,
      freeDeliveryOneKmMin: settings.freeDeliveryOneKmMin,
      freeDeliveryTwoKmMin: settings.freeDeliveryTwoKmMin,
      aboveTwoKmDeliveryCharge: settings.aboveTwoKmDeliveryCharge,
      lowOrderDeliveryCharge: settings.lowOrderDeliveryCharge
    });
  }

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
    customerEmail: input.customerEmail?.trim().toLowerCase() || null,
    phone: normalizedPhone,
    address: input.address,
    landmark: input.landmark,
    latitude: customerCoordinates?.latitude ?? null,
    longitude: customerCoordinates?.longitude ?? null,
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
      create: resolvedItems.map((item) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        customization: item.customization
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
    if ((input.userId || input.customerEmail) && isPrismaSchemaMismatchError(error)) {
      // ponytail: old DBs may still miss new account/contact columns; keep checkout alive until migrations are applied
      const { userId: _userId, customerEmail: _customerEmail, ...legacyOrderData } = orderData;
      const legacyItems = legacyOrderData.items.create.map(({ customization: _customization, ...item }) => item);
      order = await prisma.order.create({
        data: { ...legacyOrderData, items: { create: legacyItems } },
        include: {
          items: true
        }
      });
    } else {
      throw error;
    }
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
