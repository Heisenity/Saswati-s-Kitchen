import assert from "node:assert/strict";
import { buildCartRecommendations } from "../lib/cart-recommendations";
import { defaultMenuItems } from "../lib/default-data";

const catalog = defaultMenuItems.map((item) => ({
  id: item.slug,
  name: item.name,
  description: item.description,
  price: item.price,
  imageUrl: item.imageUrl,
  badge: item.badge,
  mealType: item.mealType,
  itemKind: item.itemKind,
  components: item.components
}));

const result = buildCartRecommendations({
  cart: [{ id: "veg-thali", quantity: 1 }],
  catalog,
  distanceKm: 1.5
});

assert.equal(result.subtotal, 89);
assert.equal(result.threshold, 199);
assert.equal(result.remaining, 110);
assert.ok(result.recommendations.length > 0);
assert.ok(result.bundleTotal >= 110);
assert.ok(result.bundleIds.length <= 3);
assert.ok(result.recommendations.every((item) => !/egg|chicken|fish|katla|rui|mutton/i.test(item.name)));

const curryResult = buildCartRecommendations({
  cart: [{ id: "addon-egg-curry", quantity: 1 }],
  catalog,
  distanceKm: null
});
assert.deepEqual(
  curryResult.recommendations.map((item) => item.itemKind),
  ["ADD_ON", "ADD_ON", "ADD_ON", "ADD_ON"]
);
assert.ok(curryResult.recommendations.some((item) => item.name === "Roti"));

const muttonResult = buildCartRecommendations({
  cart: [{ id: "sunday-mutton-combo", quantity: 1 }],
  catalog,
  distanceKm: null
});
assert.ok(muttonResult.recommendations.some((item) => item.name === "Roti"));
assert.ok(!muttonResult.recommendations.some((item) => item.name === "Milk Sewai"));
assert.ok(!muttonResult.recommendations.some((item) => /dalna|curry|tarka|dum|masala/i.test(item.name)));

console.log("Cart recommendation check passed.");
