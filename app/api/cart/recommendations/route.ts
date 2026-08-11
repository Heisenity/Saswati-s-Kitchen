import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCartRecommendations } from "@/lib/cart-recommendations";
import { personalizeCartCopy } from "@/lib/groq-cart-copy";
import { getMenuItems } from "@/lib/menu";
import { applyRateLimit, requireTrustedOrigin } from "@/lib/security";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

const requestSchema = z.object({
  cart: z.array(z.object({
    id: z.string().min(1).max(120),
    quantity: z.number().int().min(1).max(20)
  })).min(1).max(40),
  mealType: z.enum(["LUNCH", "DINNER"]).optional(),
  distanceKm: z.number().min(0).max(6.5).nullable().optional()
});

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const rateLimitError = applyRateLimit(request, {
    key: "cart-recommendations",
    limit: 30,
    windowMs: 60_000
  });
  if (rateLimitError) return rateLimitError;

  try {
    const input = requestSchema.parse(await request.json());
    const [menuItems, settings] = await Promise.all([getMenuItems(), getSettings()]);
    const catalog = menuItems
      .filter((item) => !input.mealType || item.mealType === input.mealType)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        badge: item.badge,
        mealType: item.mealType,
        itemKind: item.itemKind,
        components: item.components.map((component) => component.itemName)
      }));
    const deterministic = buildCartRecommendations({
      cart: input.cart,
      catalog,
      distanceKm: input.distanceKm ?? null,
      deliverySettings: {
        freeDeliveryOneKmMin: settings.freeDeliveryOneKmMin,
        freeDeliveryTwoKmMin: settings.freeDeliveryTwoKmMin,
        aboveTwoKmDeliveryCharge: settings.aboveTwoKmDeliveryCharge,
        lowOrderDeliveryCharge: settings.lowOrderDeliveryCharge
      }
    });
    const result = await personalizeCartCopy(deterministic);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid cart." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Recommendations are temporarily unavailable." }, { status: 503 });
  }
}
