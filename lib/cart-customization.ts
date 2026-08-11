export const CART_CUSTOMIZATIONS = [
  "Regular",
  "Mild spice",
  "Less oil",
  "No chilli",
  "Soft",
  "Well done",
  "Less sweet"
] as const;

export type CartCustomization = (typeof CART_CUSTOMIZATIONS)[number];

export function getCustomizationOptions(itemName: string): CartCustomization[] {
  const name = itemName.toLowerCase();

  if (name.includes("sewai")) return ["Regular", "Less sweet"];
  if (name.includes("roti")) return ["Regular", "Soft", "Well done"];
  if (/bhaja|omelette/.test(name)) return ["Regular", "Less oil", "No chilli"];
  if (/curry|tarka|dal|dalna|dum|masala|bhurji|thali|vegetable|paneer|soyabean/.test(name)) {
    return ["Regular", "Mild spice", "Less oil", "No chilli"];
  }

  return [];
}

export function sanitizeCustomization(itemName: string, value?: string | null) {
  if (!value || value === "Regular") return null;
  return getCustomizationOptions(itemName).includes(value as CartCustomization) ? value : null;
}
