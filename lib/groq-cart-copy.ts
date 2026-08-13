import { z } from "zod";
import type { CartRecommendationResult } from "@/lib/cart-recommendations";
import { env } from "@/lib/env";

const copySchema = z.object({
  headline: z.string().min(8).max(72),
  supportingCopy: z.string().min(8).max(130),
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
              "You write warm, extremely concise Benglish cart copy for a Bengali home-food kitchen. Return JSON only with headline, supportingCopy, and reasons [{id,reason}]. This card is a SMART MEAL MATCH, never a delivery-charge campaign: focus on why the selected food completes the meal, not on cart value or free delivery. Benglish means simple, natural Bengali written in correct Bengali script with familiar English food words such as meal, curry, match, and cart only where natural. Do not write formal/literary pure Bengali, Romanised Bengali, or random language mixing. Check Bengali spelling, grammar, punctuation, and relevance before returning JSON. Treat cartContext.presentRoles as already covered and cartContext.avoidRoles as forbidden. Recommendations have already been hard-filtered and assigned separate pairing roles by the server. Explain each exact role: bread helps with gravy; dessert is a sweet finish; light side balances the plate. Never recommend a second heavy curry for a rich meat thali. Return a headline that fits within two short mobile lines and a subtext that fits within two short mobile lines. Never invent popularity, scarcity, discounts, savings, ingredients, prices, delivery promises, urgency, or knowledge about the customer beyond this cart."
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
              allowedRecommendations: result.recommendations.map(({ id, name, price, reason, pairingRole }) => ({
                id,
                name,
                price,
                pairingRole,
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
