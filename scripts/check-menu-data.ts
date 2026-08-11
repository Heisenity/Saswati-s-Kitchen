import assert from "node:assert/strict";
import { addOnDefinitions, defaultMenuItems } from "../lib/default-data";

assert.equal(new Set(defaultMenuItems.map((item) => item.slug)).size, defaultMenuItems.length);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "THALI").length, 7);
assert.equal(addOnDefinitions.length, 24);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "LUNCH" && item.itemKind === "ADD_ON").length, 24);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "ADD_ON").length, 24);
for (const item of addOnDefinitions) {
  assert.ok(item.imageUrl.startsWith("/brand/addons/"));
  assert.ok(item.components.length > 0);
}
assert.equal(addOnDefinitions.find((item) => item.slug === "chicken-curry-plate")?.price, 90);
assert.equal(addOnDefinitions.find((item) => item.slug === "dhokar-dalna-1pc")?.price, 25);
assert.equal(addOnDefinitions.find((item) => item.slug === "dhokar-dalna-2pcs")?.price, 40);
for (const mealType of ["LUNCH", "DINNER"] as const) {
  const veg = defaultMenuItems.find((item) => item.slug === `${mealType === "DINNER" ? "dinner-" : ""}veg-thali`)!;
  const special = defaultMenuItems.find((item) => item.slug === `${mealType === "DINNER" ? "dinner-" : ""}special-veg-thali`)!;
  assert.ok(!veg.components.some((component) => component.toLowerCase().includes("dhoka")));
  assert.ok(special.components.includes("Paneer curry/Dhokar dalna"));
}
for (const slug of ["pabda-thali", "katlaa-macher-thali", "rui-macher-thali", "egg-thali"]) {
  assert.ok(defaultMenuItems.find((item) => item.slug === slug)!.components.some((component) => component.endsWith("(1 pc)")));
}

console.log("Menu data check passed.");
