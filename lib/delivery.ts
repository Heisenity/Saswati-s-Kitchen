type DeliveryArgs = {
  subtotal: number;
  distanceKm: number;
  freeDeliveryOneKmMin?: number;
  freeDeliveryTwoKmMin?: number;
  aboveTwoKmDeliveryCharge?: number;
  lowOrderDeliveryCharge?: number;
};

type DeliverySettings = Pick<
  DeliveryArgs,
  "freeDeliveryOneKmMin" | "freeDeliveryTwoKmMin" | "aboveTwoKmDeliveryCharge" | "lowOrderDeliveryCharge"
>;

export const MAX_DELIVERY_DISTANCE_KM = 6;

export const DELIVERY_SLABS = [
  { maxDistanceKm: 1, deliveryCharge: 15, freeDeliveryThreshold: 149 },
  { maxDistanceKm: 2, deliveryCharge: 25, freeDeliveryThreshold: 199 },
  { maxDistanceKm: 3, deliveryCharge: 35, freeDeliveryThreshold: 349 },
  { maxDistanceKm: 4, deliveryCharge: 45, freeDeliveryThreshold: 549 },
  { maxDistanceKm: 5, deliveryCharge: 55, freeDeliveryThreshold: 699 },
  { maxDistanceKm: 6, deliveryCharge: 65, freeDeliveryThreshold: 849 }
] as const;

export type DeliveryAddOn = {
  id: string;
  name: string;
  price: number;
  itemKind?: string;
};

export function getDeliverySlab(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  return DELIVERY_SLABS.find((slab) => distanceKm <= slab.maxDistanceKm) ?? null;
}

export function getFreeDeliveryThreshold(distanceKm: number, settings: DeliverySettings = {}) {
  if (distanceKm <= 1 && settings.freeDeliveryOneKmMin !== undefined) {
    return settings.freeDeliveryOneKmMin;
  }
  if (distanceKm <= 2 && settings.freeDeliveryTwoKmMin !== undefined) {
    return settings.freeDeliveryTwoKmMin;
  }
  return getDeliverySlab(distanceKm)?.freeDeliveryThreshold ?? null;
}

export function getRemainingAmount(subtotal: number, threshold: number) {
  return Math.max(0, threshold - subtotal);
}

export function getFreeDeliveryProgress(subtotal: number, threshold: number) {
  return threshold > 0 ? Math.min(100, Math.max(0, (subtotal / threshold) * 100)) : 0;
}

export function getDeliveryFee(distanceKm: number, subtotal: number, settings: DeliverySettings = {}) {
  const slab = getDeliverySlab(distanceKm);
  if (!slab || subtotal <= 0) return 0;
  const threshold = getFreeDeliveryThreshold(distanceKm, settings);
  if (threshold !== null && subtotal >= threshold) return 0;
  if (distanceKm > 2 && settings.aboveTwoKmDeliveryCharge !== undefined) {
    return settings.aboveTwoKmDeliveryCharge;
  }
  if (distanceKm <= 2 && settings.lowOrderDeliveryCharge !== undefined) {
    return settings.lowOrderDeliveryCharge;
  }
  return slab.deliveryCharge;
}

export function getSuggestedAddOns<T extends DeliveryAddOn>(
  remainingAmount: number,
  availableAddOns: T[]
) {
  return availableAddOns
    .filter((item) => (item.itemKind === "ADD_ON" || item.itemKind === "THALI") && item.price > 0)
    .sort(
      (left, right) =>
        Math.abs(remainingAmount - left.price) - Math.abs(remainingAmount - right.price)
    )
    .slice(0, 5);
}

export function haversineDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function calculateDeliveryCharge({
  subtotal,
  distanceKm,
  freeDeliveryOneKmMin,
  freeDeliveryTwoKmMin,
  aboveTwoKmDeliveryCharge,
  lowOrderDeliveryCharge
}: DeliveryArgs) {
  return getDeliveryFee(distanceKm, subtotal, {
    freeDeliveryOneKmMin,
    freeDeliveryTwoKmMin,
    aboveTwoKmDeliveryCharge,
    lowOrderDeliveryCharge
  });
}
