import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

type DeliveryQuotePayload = {
  quoteId: string;
  query: string;
  latitude: number;
  longitude: number;
  expiresAt: number;
};

function getQuoteSecret() {
  return env.deliveryQuoteSecret || "saswatis-kitchen-delivery-quote";
}

function sign(value: string) {
  return createHmac("sha256", getQuoteSecret()).update(value).digest("base64url");
}

export function createDeliveryQuoteToken(input: Omit<DeliveryQuotePayload, "quoteId" | "expiresAt"> & { quoteId?: string; expiresAt?: number }) {
  const payload: DeliveryQuotePayload = {
    quoteId: input.quoteId ?? randomUUID(),
    query: input.query,
    latitude: input.latitude,
    longitude: input.longitude,
    expiresAt: input.expiresAt ?? Date.now() + 30 * 60 * 1000
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    quoteId: payload.quoteId,
    quoteToken: `${encodedPayload}.${sign(encodedPayload)}`,
    expiresAt: payload.expiresAt
  };
}

export function verifyDeliveryQuoteToken(quoteId?: string, quoteToken?: string, query?: string) {
  if (!quoteId || !quoteToken || !query) return null;

  const [encodedPayload, providedSignature] = quoteToken.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  if (providedSignature.length !== expectedSignature.length) return null;
  const signatureMatches = timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );
  if (!signatureMatches) return null;

  let payload: DeliveryQuotePayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as DeliveryQuotePayload;
  } catch {
    return null;
  }

  if (payload.quoteId !== quoteId) return null;
  if (payload.expiresAt <= Date.now()) return null;
  if (payload.query !== query) return null;

  return payload;
}
