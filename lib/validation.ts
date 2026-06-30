import { z } from "zod";
import { paymentProofAnalysisSchema } from "@/lib/payment-proof";

export const orderSchema = z.object({
  checkoutToken: z.string().min(10),
  customerName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(8),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  slotType: z.enum(["LUNCH", "DINNER"]),
  paymentScreenshotUrl: z.string().min(1).optional(),
  paymentProofAnalysis: paymentProofAnalysisSchema.optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().optional(),
        itemName: z.string().min(2),
        quantity: z.number().int().min(1),
        unitPrice: z.number().int().min(1)
      })
    )
    .min(1)
});

export const orderLookupSchema = z.object({
  orderNumber: z.string().min(4),
  phone: z.string().min(10)
});

export const customerChatSessionSchema = z.object({
  customerName: z.string().min(2).max(40),
  phone: z.string().min(10).max(16),
  orderNumber: z.string().min(4).optional().nullable()
});

export const customerChatMessageSchema = z.object({
  chatId: z.string().min(6),
  customerName: z.string().min(2).max(40),
  phone: z.string().min(10).max(16),
  message: z.string().min(1).max(4000),
  clientId: z.string().optional()
});

export const adminChatMessageSchema = z.object({
  chatId: z.string().min(6),
  message: z.string().min(1).max(4000),
  clientId: z.string().optional()
});

export const adminPresenceSchema = z.object({
  online: z.boolean()
});

export const customerPresenceSchema = z.object({
  chatId: z.string().min(6),
  online: z.boolean()
});

export const geocodeSchema = z.object({
  address: z.string().min(5),
  landmark: z.string().optional()
});

export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(8),
  price: z.number().int().min(1),
  imageUrl: z.string().min(1),
  mealType: z.enum(["LUNCH", "DINNER"]),
  itemKind: z.enum(["THALI", "ADD_ON"]),
  badge: z.string().min(2),
  isActive: z.boolean(),
  stockLimit: z.number().int().min(0),
  components: z.array(z.string().min(1)).min(1)
});

export const bulkMenuComponentSchema = z.object({
  menuItemIds: z.array(z.string().min(1)).min(1),
  action: z.enum(["add_component", "remove_component"]),
  component: z.string().min(2)
});

export const settingSchema = z.object({
  kitchenLatitude: z.number(),
  kitchenLongitude: z.number(),
  lunchCloseTime: z.string().regex(/^\d{2}:\d{2}$/),
  dinnerOpenTime: z.string().regex(/^\d{2}:\d{2}$/),
  dinnerCloseTime: z.string().regex(/^\d{2}:\d{2}$/),
  freeDeliveryOneKmMin: z.number().int().min(0),
  freeDeliveryTwoKmMin: z.number().int().min(0),
  aboveTwoKmDeliveryCharge: z.number().int().min(0),
  lowOrderDeliveryCharge: z.number().int().min(0),
  upiId: z.string().min(3),
  qrImageUrl: z.string().min(1)
});

export const orderStatusUpdateSchema = z.object({
  orderStatus: z.enum([
    "PAYMENT_PENDING_VERIFICATION",
    "CONFIRMED",
    "REJECTED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
  ])
});
