import assert from "node:assert/strict";
import { addOnDefinitions, defaultMenuItems } from "../lib/default-data";

assert.equal(new Set(defaultMenuItems.map((item) => item.slug)).size, defaultMenuItems.length);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "THALI").length, 7);
assert.equal(addOnDefinitions.length, 30);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "LUNCH" && item.itemKind === "ADD_ON").length, 30);
assert.equal(defaultMenuItems.filter((item) => item.mealType === "DINNER" && item.itemKind === "ADD_ON").length, 30);
for (const item of addOnDefinitions) {
  assert.ok(item.imageUrl.startsWith("/brand/addons/"));
  assert.ok(item.components.length > 0);
}
assert.equal(addOnDefinitions[0].slug, "mutton-kosha-3pcs");
assert.equal(addOnDefinitions[1].slug, "mutton-kosha-2pcs");
assert.equal(addOnDefinitions[2].slug, "roti");
assert.equal(addOnDefinitions[addOnDefinitions.length - 4].slug, "veg-fried-rice");
assert.equal(addOnDefinitions[addOnDefinitions.length - 3].slug, "chicken-fried-rice");
assert.equal(addOnDefinitions[addOnDefinitions.length - 2].slug, "boiled-egg-2pcs");
assert.equal(addOnDefinitions[addOnDefinitions.length - 1].slug, "boiled-egg-1pc");
assert.equal(addOnDefinitions.find((item) => item.slug === "roti")?.price, 7);
assert.equal(addOnDefinitions.find((item) => item.slug === "butter-roti")?.price, 15);
assert.equal(addOnDefinitions.find((item) => item.slug === "chicken-curry-plate")?.price, 100);
assert.equal(addOnDefinitions.find((item) => item.slug === "chicken-curry-plate")?.badge, "3 pcs");
assert.equal(addOnDefinitions.find((item) => item.slug === "dhokar-dalna-1pc")?.price, 35);
assert.equal(addOnDefinitions.find((item) => item.slug === "dhokar-dalna-2pcs")?.price, 50);
assert.equal(addOnDefinitions.find((item) => item.slug === "mutton-kosha-3pcs")?.price, 320);
assert.equal(addOnDefinitions.find((item) => item.slug === "mutton-kosha-2pcs")?.price, 299);
assert.equal(addOnDefinitions.find((item) => item.slug === "veg-fried-rice")?.price, 90);
assert.equal(addOnDefinitions.find((item) => item.slug === "chicken-fried-rice")?.price, 125);
assert.equal(addOnDefinitions.find((item) => item.slug === "boiled-egg-2pcs")?.price, 30);
assert.equal(addOnDefinitions.find((item) => item.slug === "boiled-egg-1pc")?.price, 15);
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
