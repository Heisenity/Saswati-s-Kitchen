import { z } from "zod";
import type { CartRecommendationResult } from "@/lib/cart-recommendations";
import { env } from "@/lib/env";

const copySchema = z.object({
  headline: z.string().min(8).max(110),
  supportingCopy: z.string().min(8).max(180),
  reasons: z.array(z.object({
    id: z.string().min(1),
    reason: z.string().min(6).max(100)
  })).max(4)
});

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

export async function personalizeCartCopy(result: CartRecommendationResult) {
  if (!env.groqApiKey || result.recommendations.length === 0) return result;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0.35,
        max_completion_tokens: 260,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write warm, concise Bengali-English cart copy for a Bengali home-food kitchen. Return JSON only with headline, supportingCopy, and reasons [{id,reason}]. Read the cart context to adapt the copy to what the customer has actually chosen: their meal style, dietary pattern, whether they appear to be sharing, and the components already covered. Use the exact rupee facts supplied. Never invent popularity, scarcity, discounts, savings, ingredients, prices, delivery promises, urgency, or knowledge about the customer beyond this cart. Be emotionally warm and encouraging—make the meal feel thoughtfully complete—without guilt, pressure, or deception. Each reason must describe why that exact food complements the cart."
          },
          {
            role: "user",
            content: JSON.stringify({
              facts: {
                subtotal: result.subtotal,
                freeDeliveryThreshold: result.threshold,
                amountStillNeeded: result.remaining,
                currentDeliveryFee: result.deliveryFee
              },
              cartContext: result.cartContext,
              fallbackCopy: {
                headline: result.headline,
                supportingCopy: result.supportingCopy
              },
              allowedRecommendations: result.recommendations.map(({ id, name, price, reason }) => ({
                id,
                name,
                price,
                factualReason: reason
              }))
            })
          }
        ]
      })
    });

    if (!response.ok) return result;
    const payload = await response.json() as GroqResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return result;

    const personalized = copySchema.safeParse(JSON.parse(content));
    if (!personalized.success) return result;

    const allowedIds = new Set(result.recommendations.map((item) => item.id));
    const reasons = new Map(
      personalized.data.reasons
        .filter((entry) => allowedIds.has(entry.id))
        .map((entry) => [entry.id, entry.reason])
    );

    return {
      ...result,
      headline: personalized.data.headline,
      supportingCopy: personalized.data.supportingCopy,
      recommendations: result.recommendations.map((item) => ({
        ...item,
        reason: reasons.get(item.id) ?? item.reason
      }))
    };
  } catch {
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
