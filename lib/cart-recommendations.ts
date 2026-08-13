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
  pairingRole: PairingRole;
};

type PairingRole = "bread" | "dessert" | "light_side" | "staple" | "main_curry" | "protein_side" | "other";

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
    mealStyle: "rich_bengali_nonveg" | "bengali_main" | "vegetarian_meal" | "light_meal";
    presentRoles: PairingRole[];
    missingRoles: PairingRole[];
    avoidRoles: PairingRole[];
  };
};

const nonVegPattern = /egg|chicken|mutton|fish|katla|rui|pabda|chingri|prawn|meat|mach/i;
const dessertPattern = /sewai|sweet|roshogolla|dessert/i;
const staplePattern = /roti|rice|parantha/i;
const curryPattern = /curry|tarka|dalna|dum|masala|kosha/i;
const lightSidePattern = /bhaja|vegetable|dal|daal|salad|papad/i;

/**
 * A small Bengali meal ontology. It intentionally lives beside the recommender,
 * not in LLM prompt text, so every suggestion follows the same cultural rules.
 */
function getPairingRole(item: RecommendationCatalogItem): PairingRole {
  const text = searchableText(item);
  if (/roti|parantha|lুচি|luchi/.test(text)) return "bread";
  if (dessertPattern.test(text)) return "dessert";
  if (/rice|pulao|biryani/.test(text)) return "staple";
  if (/bhaja|salad|papad|chutney|aachar/.test(text)) return "light_side";
  if (curryPattern.test(text)) return "main_curry";
  if (nonVegPattern.test(text)) return "protein_side";
  return "other";
}

function getCoveredRoles(item: RecommendationCatalogItem): PairingRole[] {
  const text = searchableText(item);
  const roles = new Set<PairingRole>();
  if (/roti|parantha|lুচি|luchi/.test(text)) roles.add("bread");
  if (dessertPattern.test(text)) roles.add("dessert");
  if (/rice|pulao|biryani/.test(text)) roles.add("staple");
  if (/bhaja|salad|papad|chutney|aachar/.test(text)) roles.add("light_side");
  if (curryPattern.test(text)) roles.add("main_curry");
  if (nonVegPattern.test(text)) roles.add("protein_side");
  return roles.size ? [...roles] : ["other"];
}

function searchableText(item: RecommendationCatalogItem) {
  return [item.name, item.description, ...item.components].join(" ").toLowerCase();
}

function getReason(role: PairingRole, hasRichMain: boolean) {
  if (role === "bread" && hasRichMain) return "মটন বা chicken-এর gravy-র সঙ্গে দারুণ মানাবে";
  if (role === "dessert") return "শেষে হালকা মিষ্টি—খাবারটা সুন্দরভাবে সম্পূর্ণ হবে";
  if (role === "light_side") return "মূল খাবারের পাশে হালকা Bengali touch";
  if (role === "staple") return "পছন্দের ঝোলটা আরাম করে উপভোগ করার জন্য";
  return "আজকের meal-এর সঙ্গে স্বাভাবিকভাবে মানাবে";
}

function complementScore(
  candidate: RecommendationCatalogItem,
  cartItems: RecommendationCatalogItem[],
  remaining: number | null,
  presentRoles: Set<PairingRole>,
  hasRichMain: boolean
) {
  const candidateText = searchableText(candidate);
  const cartText = cartItems.map(searchableText).join(" ");
  const cartIsVegetarian = cartItems.length > 0 && !nonVegPattern.test(cartText);
  const role = getPairingRole(candidate);
  let score = candidate.itemKind === "ADD_ON" ? 18 : -30;

  if (cartIsVegetarian && nonVegPattern.test(candidateText)) score -= 100;
  // Meal-completion ranks above delivery-gap convenience. A rich thali never
  // needs a second gravy-heavy main just because it is an inexpensive add-on.
  if (hasRichMain && role === "main_curry") score -= 150;
  if (presentRoles.has(role)) score -= role === "dessert" ? 50 : 80;
  if (hasRichMain && role === "bread" && !presentRoles.has("bread")) score += 82;
  if (hasRichMain && role === "dessert" && !presentRoles.has("dessert")) score += 78;
  if (role === "light_side" && !presentRoles.has("light_side")) score += 42;
  if (role === "staple" && !presentRoles.has("staple")) score += 35;
  if (!hasRichMain && staplePattern.test(cartText) && curryPattern.test(candidateText)) score += 22;
  if (!hasRichMain && curryPattern.test(cartText) && staplePattern.test(candidateText)) score += 24;
  // Price only breaks ties after cultural fit and meal completeness.
  if (remaining !== null) score -= Math.min(8, Math.abs(remaining - candidate.price) / 50);

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
  const cartLead = cartItems[0]?.name ?? "আজকের খাবার";
  const cartText = cartItems.map(searchableText).join(" ");
  const totalQuantity = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const presentRoles = new Set(cartItems.flatMap(getCoveredRoles));
  const hasRichMain = cartItems.some((item) =>
    item.itemKind === "THALI" && (nonVegPattern.test(searchableText(item)) || curryPattern.test(searchableText(item)))
  );
  const mealType = cartItems[0]?.mealType;
  const candidates = catalog
    .filter((item) => !cartIds.has(item.id) && (!mealType || item.mealType === mealType) && item.itemKind === "ADD_ON")
    .map((item) => ({
      item,
      role: getPairingRole(item),
      score: complementScore(item, cartItems, remaining, presentRoles, hasRichMain)
    }))
    .filter(({ role }) => !(hasRichMain && role === "main_curry"))
    .sort((left, right) => right.score - left.score);
  const rankedCandidates = candidates.map(({ item }) => item);
  const bundle = chooseGoalBundle(rankedCandidates, remaining);

  // Each visual slot has a separate responsibility. This removes redundant
  // pairings such as Roti + another gravy curry for a mutton combo.
  const highlighted: RecommendationCatalogItem[] = [];
  const usedRoles = new Set<PairingRole>();
  for (const candidate of candidates) {
    // A complete thali does not need a made-up second recommendation. Only
    // show an item if it has a positive meal-completion case of its own.
    if (candidate.score < 25) continue;
    const role = candidate.role;
    if (usedRoles.has(role)) continue;
    highlighted.push(candidate.item);
    usedRoles.add(role);
    if (highlighted.length === 3) break;
  }
  const mealStyle: CartRecommendationResult["cartContext"]["mealStyle"] = hasRichMain
    ? "rich_bengali_nonveg"
    : cartItems.length > 0 && !nonVegPattern.test(cartText)
      ? "vegetarian_meal"
      : curryPattern.test(cartText)
        ? "bengali_main"
        : "light_meal";
  const cartContext = {
    items: cart.flatMap(({ id, quantity }) => {
      const item = catalogById.get(id);
      return item ? [{ name: item.name, quantity, components: item.components }] : [];
    }),
    hasStaple: staplePattern.test(cartText),
    hasCurry: curryPattern.test(cartText),
    hasDessert: dessertPattern.test(cartText),
    isVegetarian: cartItems.length > 0 && !nonVegPattern.test(cartText),
    isSharing: totalQuantity > 1,
    mealStyle,
    presentRoles: [...presentRoles],
    missingRoles: (["bread", "dessert", "light_side"] as PairingRole[]).filter((role) => !presentRoles.has(role)),
    avoidRoles: hasRichMain ? ["main_curry" as PairingRole] : []
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
    headline: hasRichMain
      ? `${cartLead.replace(/combo|thali/gi, "").trim()}-এর সঙ্গে এগুলো জমবে`
      : "আজকের meal-এর সঙ্গে এগুলো দারুণ মানাবে",
    supportingCopy:
      hasRichMain
        ? "ঝোলের সঙ্গে একটি companion আর শেষে হালকা sweet finish—খাবারটা সুন্দরভাবে complete হবে।"
        : `${mealMoment} এই add-onগুলো স্বাভাবিকভাবে মানাবে।`,
    recommendations: highlighted.map((item) => ({
      ...item,
      pairingRole: getPairingRole(item),
      reason: getReason(getPairingRole(item), hasRichMain)
    })),
    bundleIds: bundle.map((item) => item.id),
    bundleTotal: bundle.reduce((sum, item) => sum + item.price, 0),
    cartContext
  };
}
