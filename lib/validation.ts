import { z } from "zod";

export const orderSchema = z.object({
  checkoutToken: z.string().min(10),
  customerName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(8),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  slotType: z.enum(["LUNCH", "DINNER"]),
  paymentUtr: z.string().min(6).optional(),
  paymentScreenshotUrl: z.string().url().optional(),
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

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(8),
  price: z.number().int().min(1),
  imageUrl: z.string().min(1),
  mealType: z.enum(["LUNCH", "DINNER"]),
  badge: z.string().min(2),
  isActive: z.boolean(),
  stockLimit: z.number().int().min(0),
  components: z.array(z.string().min(1)).min(1)
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
