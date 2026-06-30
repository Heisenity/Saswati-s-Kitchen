import assert from "node:assert/strict";
import { defaultMenuItems } from "../lib/default-data";

assert.equal(new Set(defaultMenuItems.map((item) => item.slug)).size, defaultMenuItems.length);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "THALI").length, 4);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "LUNCH" && item.itemKind === "ADD_ON").length, 3);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "ADD_ON").length, 3);

console.log("Menu data check passed.");
