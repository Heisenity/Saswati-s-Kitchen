type DeliveryArgs = {
  subtotal: number;
  distanceKm: number;
  freeDeliveryOneKmMin?: number;
  freeDeliveryTwoKmMin?: number;
  aboveTwoKmDeliveryCharge?: number;
  lowOrderDeliveryCharge?: number;
};

export const MAX_DELIVERY_DISTANCE_KM = 6;
export const NEARBY_DELIVERY_CHARGE = 12;
export const FULL_RANGE_FREE_DELIVERY_MIN = 350;

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
  freeDeliveryOneKmMin = 99,
  freeDeliveryTwoKmMin = 139,
  aboveTwoKmDeliveryCharge = 29,
  lowOrderDeliveryCharge = 19
}: DeliveryArgs) {
  if (subtotal <= 0) return 0;
  if (distanceKm > MAX_DELIVERY_DISTANCE_KM) return 0;
  if (subtotal >= FULL_RANGE_FREE_DELIVERY_MIN) return 0;
  if (distanceKm <= 1) {
    return subtotal >= freeDeliveryOneKmMin ? 0 : NEARBY_DELIVERY_CHARGE;
  }
  if (distanceKm <= 2) {
    return subtotal >= freeDeliveryTwoKmMin ? 0 : lowOrderDeliveryCharge;
  }
  return aboveTwoKmDeliveryCharge;
}
