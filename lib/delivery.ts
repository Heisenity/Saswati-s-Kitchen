type DeliveryArgs = {
  subtotal: number;
  distanceKm: number;
  freeDeliveryOneKmMin: number;
  freeDeliveryTwoKmMin: number;
  aboveTwoKmDeliveryCharge: number;
  lowOrderDeliveryCharge: number;
};

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
  if (distanceKm > 2) return aboveTwoKmDeliveryCharge;
  if (distanceKm > 1) {
    return subtotal >= freeDeliveryTwoKmMin ? 0 : lowOrderDeliveryCharge;
  }

  return subtotal >= freeDeliveryOneKmMin ? 0 : lowOrderDeliveryCharge;
}
