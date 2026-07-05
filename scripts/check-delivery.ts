import assert from "node:assert/strict";
import {
  getDeliveryFee,
  getFreeDeliveryProgress,
  getFreeDeliveryThreshold,
  getRemainingAmount,
  getSuggestedAddOns
} from "../lib/delivery";

assert.equal(getFreeDeliveryThreshold(2.5), 349);
assert.equal(getRemainingAmount(159, 349), 190);
assert.equal(getDeliveryFee(2.5, 159), 35);
assert.equal(getDeliveryFee(2.5, 349), 0);
assert.equal(getDeliveryFee(1, 89), 15);
assert.equal(getDeliveryFee(6, 849), 0);
assert.equal(getDeliveryFee(6, 259), 65);
assert.equal(getFreeDeliveryProgress(349, 349), 100);
assert.deepEqual(
  getSuggestedAddOns(12, [
    { id: "rice", name: "Extra Rice", price: 20, itemKind: "ADD_ON" },
    { id: "roti", name: "Roti", price: 5, itemKind: "ADD_ON" },
    { id: "paratha", name: "Butter Paratha", price: 10, itemKind: "ADD_ON" },
    { id: "thali", name: "Veg Thali", price: 89, itemKind: "THALI" }
  ]).map((item) => item.id),
  ["paratha", "roti", "rice", "thali"]
);

console.log("Delivery slab checks passed.");
