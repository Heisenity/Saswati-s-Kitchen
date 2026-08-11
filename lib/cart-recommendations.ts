import {
  getDeliveryFee,
  getFreeDeliveryThreshold,
  getRemainingAmount
} from "@/lib/delivery";

export type RecommendationCatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  badge: string;
  mealType: "LUNCH" | "DINNER";
  itemKind: "THALI" | "ADD_ON";
  components: string[];
};

export type CartRecommendation = RecommendationCatalogItem & {
  reason: string;
};

export type CartRecommendationResult = {
  subtotal: number;
  threshold: number | null;
  remaining: number | null;
  deliveryFee: number | null;
  progress: number | null;
  headline: string;
  supportingCopy: string;
  recommendations: CartRecommendation[];
  bundleIds: string[];
  bundleTotal: number;
  /** Server-derived meal context used only to keep LLM copy relevant and truthful. */
  cartContext: {
    items: Array<{ name: string; quantity: number; components: string[] }>;
    hasStaple: boolean;
    hasCurry: boolean;
    hasDessert: boolean;
    isVegetarian: boolean;
    isSharing: boolean;
  };
};

const nonVegPattern = /egg|chicken|mutton|fish|katla|rui|pabda|chingri|prawn|meat|mach/i;
const dessertPattern = /sewai|sweet|roshogolla|dessert/i;
const staplePattern = /roti|rice|parantha/i;
const curryPattern = /curry|tarka|dalna|dum|masala|kosha/i;
const lightSidePattern = /bhaja|vegetable|dal|daal|salad|papad/i;

function searchableText(item: RecommendationCatalogItem) {
  return [item.name, item.description, ...item.components].join(" ").toLowerCase();
}

function getReason(item: RecommendationCatalogItem, cartItems: RecommendationCatalogItem[]) {
  const itemText = searchableText(item);
  const cartText = cartItems.map(searchableText).join(" ");

  if (dessertPattern.test(itemText)) return "শেষে একটু মিষ্টি—খাবারটা সম্পূর্ণ লাগে";
  if (staplePattern.test(itemText) && curryPattern.test(cartText)) return "আপনার curry-র gravy-র সঙ্গে সবচেয়ে কাজে লাগবে";
  if (curryPattern.test(itemText) && staplePattern.test(cartText)) return "রুটি বা ভাতের সঙ্গে আরেকটু ঘরের স্বাদ";
  if (lightSidePattern.test(itemText)) return "মূল খাবারের পাশে হালকা, পরিচিত Bengali comfort";
  if (item.itemKind === "ADD_ON") return "অল্প যোগে plate-টা আরও ভরপুর হবে";
  return "একসঙ্গে নিলে পরিবারের টেবিলটা আরও পরিপূর্ণ হবে";
}

function complementScore(
  candidate: RecommendationCatalogItem,
  cartItems: RecommendationCatalogItem[],
  remaining: number | null
) {
  const candidateText = searchableText(candidate);
  const cartText = cartItems.map(searchableText).join(" ");
  const cartIsVegetarian = cartItems.length > 0 && !nonVegPattern.test(cartText);
  let score = candidate.itemKind === "ADD_ON" ? 16 : 0;

  if (cartIsVegetarian && nonVegPattern.test(candidateText)) score -= 100;
  if (staplePattern.test(cartText) && curryPattern.test(candidateText)) score += 22;
  if (curryPattern.test(cartText) && staplePattern.test(candidateText)) score += 24;
  if (candidate.itemKind === "ADD_ON" && lightSidePattern.test(candidateText)) score += 12;
  if (dessertPattern.test(candidateText) && !dessertPattern.test(cartText)) score += 14;
  if (remaining !== null) score -= Math.abs(remaining - candidate.price) / 8;

  return score;
}

function chooseGoalBundle(items: RecommendationCatalogItem[], remaining: number | null) {
  if (!remaining || remaining <= 0) return [];

  // Make add-ons the route to the free-delivery goal. A thali is only a fallback
  // when the active add-on menu genuinely cannot make a useful combination.
  const addOns = items.filter((item) => item.itemKind === "ADD_ON").slice(0, 16);
  const pool = addOns.length ? addOns : items.slice(0, 4);
  let best: RecommendationCatalogItem[] = [];
  let bestCost = Number.POSITIVE_INFINITY;
  let bestOvershoot = Number.POSITIVE_INFINITY;

  const consider = (bundle: RecommendationCatalogItem[]) => {
    const total = bundle.reduce((sum, item) => sum + item.price, 0);
    if (total < remaining) return;
    const overshoot = total - remaining;
    if (overshoot < bestOvershoot || (overshoot === bestOvershoot && total < bestCost)) {
      best = bundle;
      bestCost = total;
      bestOvershoot = overshoot;
    }
  };

  for (let first = 0; first < pool.length; first += 1) {
    consider([pool[first]]);
    for (let second = first + 1; second < pool.length; second += 1) {
      consider([pool[first], pool[second]]);
      for (let third = second + 1; third < pool.length; third += 1) {
        consider([pool[first], pool[second], pool[third]]);
        for (let fourth = third + 1; fourth < pool.length; fourth += 1) {
          consider([pool[first], pool[second], pool[third], pool[fourth]]);
        }
      }
    }
  }

  return best;
}

export function buildCartRecommendations({
  cart,
  catalog,
  distanceKm,
  deliverySettings = {}
}: {
  cart: Array<{ id: string; quantity: number }>;
  catalog: RecommendationCatalogItem[];
  distanceKm: number | null;
  deliverySettings?: {
    freeDeliveryOneKmMin?: number;
    freeDeliveryTwoKmMin?: number;
    aboveTwoKmDeliveryCharge?: number;
    lowOrderDeliveryCharge?: number;
  };
}): CartRecommendationResult {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const cartItems = cart.flatMap(({ id }) => {
    const item = catalogById.get(id);
    return item ? [item] : [];
  });
  const subtotal = cart.reduce((sum, entry) => {
    const item = catalogById.get(entry.id);
    return sum + (item?.price ?? 0) * entry.quantity;
  }, 0);
  const threshold = distanceKm === null ? null : getFreeDeliveryThreshold(distanceKm, deliverySettings);
  const remaining = threshold === null ? null : getRemainingAmount(subtotal, threshold);
  const deliveryFee = distanceKm === null ? null : getDeliveryFee(distanceKm, subtotal, deliverySettings);
  const cartIds = new Set(cart.map((item) => item.id));
  const mealType = cartItems[0]?.mealType;
  const candidates = catalog
    .filter((item) => !cartIds.has(item.id) && (!mealType || item.mealType === mealType))
    .sort((left, right) => complementScore(right, cartItems, remaining) - complementScore(left, cartItems, remaining));
  const bundle = chooseGoalBundle(candidates, remaining);
  const addOnCandidates = candidates.filter((item) => item.itemKind === "ADD_ON");
  // The visible card should feel like a thoughtful finishing touch to a meal,
  // not a second thali catalogue. Keep four add-ons first, then use a fallback.
  const highlighted = [...bundle.filter((item) => item.itemKind === "ADD_ON"), ...addOnCandidates, ...bundle, ...candidates]
    .filter((item, index, all) => all.findIndex((entry) => entry.id === item.id) === index)
    .slice(0, 4);
  const cartLead = cartItems[0]?.name ?? "আজকের খাবার";
  const cartText = cartItems.map(searchableText).join(" ");
  const totalQuantity = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartContext = {
    items: cart.flatMap(({ id, quantity }) => {
      const item = catalogById.get(id);
      return item ? [{ name: item.name, quantity, components: item.components }] : [];
    }),
    hasStaple: staplePattern.test(cartText),
    hasCurry: curryPattern.test(cartText),
    hasDessert: dessertPattern.test(cartText),
    isVegetarian: cartItems.length > 0 && !nonVegPattern.test(cartText),
    isSharing: totalQuantity > 1
  };
  const mealMoment = cartContext.isSharing
    ? "একসঙ্গে খাওয়ার টেবিলের জন্য"
    : cartContext.hasCurry
      ? "আপনার পছন্দের curry-র সঙ্গে"
      : "আজকের খাবারের সঙ্গে";

  return {
    subtotal,
    threshold,
    remaining,
    deliveryFee,
    progress: threshold ? Math.min(100, Math.round((subtotal / threshold) * 100)) : null,
    headline:
      remaining === 0
        ? "Free delivery unlocked—এবার শুধু খাবারটা উপভোগ করুন"
        : remaining !== null
          ? `আর ₹${remaining} খাবারে রাখলেই delivery charge ₹${deliveryFee ?? 0} বাঁচবে`
          : "Delivery charge নয়—টাকাটা খাবারেই থাক",
    supportingCopy:
      remaining === 0
        ? `${cartLead}-সহ আপনার cart free delivery-র জন্য তৈরি—এবার ঘরের স্বাদটা নিশ্চিন্তে উপভোগ করুন।`
        : `${mealMoment} এই add-onগুলো মিলিয়ে নিলে plate-টা আরও সম্পূর্ণ হবে।`,
    recommendations: highlighted.map((item) => ({
      ...item,
      reason: getReason(item, cartItems)
    })),
    bundleIds: bundle.map((item) => item.id),
    bundleTotal: bundle.reduce((sum, item) => sum + item.price, 0),
    cartContext
  };
}
