import type { MenuSeed } from "@/types";

export const defaultKitchenAddress =
  "17/c, Panpara 5th Ln, Talpukur, Anandapuri, Barrackpore, West Bengal 700123";
export const defaultKitchenCoordinates = {
  latitude: 22.757527,
  longitude: 88.380229
};

type AddOnDefinition = Omit<MenuSeed, "slug" | "mealType" | "itemKind"> & {
  slug: string;
};

export const addOnDefinitions: AddOnDefinition[] = [
  { name: "Roti", slug: "roti", description: "One fresh, soft roti—perfect with any curry.", price: 5, badge: "1 pc", imageUrl: "/brand/addons/roti.jpg", stockLimit: 100, components: ["1 piece"] },
  { name: "Butter Roti", slug: "butter-roti", description: "One warm roti finished with a light touch of butter.", price: 10, badge: "1 pc", imageUrl: "/brand/addons/butter-roti.jpg", stockLimit: 100, components: ["1 piece"] },
  { name: "Extra Rice", slug: "extra-rice", description: "One extra plate of fluffy steamed rice.", price: 20, badge: "1 plate", imageUrl: "/brand/addons/extra-rice.jpg", stockLimit: 60, components: ["1 plate"] },
  { name: "Egg Curry", slug: "egg-curry", description: "Homestyle Bengali egg curry with two eggs.", price: 40, badge: "2 pcs", imageUrl: "/brand/addons/egg-curry.jpg", stockLimit: 40, components: ["1 plate · 2 eggs"] },
  { name: "Katla Fish Curry", slug: "katla-fish-curry", description: "Bengali katla curry with one generous fish piece.", price: 60, badge: "1 pc", imageUrl: "/brand/addons/katla-fish-curry.jpg", stockLimit: 30, components: ["1 plate · 1 fish piece"] },
  { name: "Rui Fish Curry", slug: "rui-fish-curry", description: "Classic rui curry with one comforting fish piece.", price: 40, badge: "1 pc", imageUrl: "/brand/addons/rui-fish-curry.jpg", stockLimit: 35, components: ["1 plate · 1 fish piece"] },
  { name: "Chicken Curry", slug: "chicken-curry-plate", description: "Homestyle chicken curry with four pieces.", price: 90, badge: "4 pcs", imageUrl: "/brand/addons/chicken-curry.jpg", stockLimit: 30, components: ["1 plate · 4 chicken pieces"] },
  { name: "Cholar Dal", slug: "cholar-dal", description: "A comforting plate of lightly spiced Bengali cholar dal.", price: 30, badge: "1 plate", imageUrl: "/brand/addons/cholar-dal.jpg", stockLimit: 40, components: ["1 plate"] },
  { name: "Aloo Dum", slug: "aloo-dum", description: "Bengali aloo dum with four tender potato pieces.", price: 40, badge: "4 pcs", imageUrl: "/brand/addons/aloo-dum.jpg", stockLimit: 35, components: ["1 plate · 4 potato pieces"] },
  { name: "Aloo Bhaja", slug: "aloo-bhaja", description: "Crisp, golden Bengali-style fried potato strips.", price: 25, badge: "1 plate", imageUrl: "/brand/addons/aloo-bhaja.jpg", stockLimit: 40, components: ["1 plate"] },
  { name: "Bhindi Bhaja", slug: "bhindi-bhaja", description: "Lightly spiced, dry-fried okra with homestyle flavour.", price: 25, badge: "1 plate", imageUrl: "/brand/addons/bhindi-bhaja.jpg", stockLimit: 35, components: ["1 plate"] },
  { name: "Mixed Vegetables", slug: "mixed-vegetables", description: "A colourful homestyle mix of seasonal vegetables.", price: 50, badge: "1 plate", imageUrl: "/brand/addons/mixed-vegetables.jpg", stockLimit: 35, components: ["1 plate"] },
  { name: "Egg Omelette", slug: "egg-omelette", description: "A freshly cooked, lightly seasoned one-egg omelette.", price: 15, badge: "1 pc", imageUrl: "/brand/addons/egg-omelette.jpg", stockLimit: 50, components: ["1 egg omelette"] },
  { name: "Milk Sewai", slug: "milk-sewai", description: "Creamy milk sewai with a gentle cardamom sweetness.", price: 50, badge: "1 plate", imageUrl: "/brand/addons/milk-sewai.jpg", stockLimit: 30, components: ["1 plate"] },
  { name: "Egg Bhurji", slug: "egg-bhurji", description: "Fresh egg bhurji prepared with two eggs.", price: 40, badge: "2 eggs", imageUrl: "/brand/addons/egg-bhurji.jpg", stockLimit: 40, components: ["1 plate · 2 eggs"] },
  { name: "Dhokar Dalna", slug: "dhokar-dalna-1pc", description: "Bengali dhokar dalna with one golden lentil cake.", price: 25, badge: "1 pc", imageUrl: "/brand/addons/dhokar-dalna-1pc.jpg", stockLimit: 35, components: ["1 plate · 1 piece"] },
  { name: "Dhokar Dalna", slug: "dhokar-dalna-2pcs", description: "Bengali dhokar dalna with two golden lentil cakes.", price: 40, badge: "2 pcs", imageUrl: "/brand/addons/dhokar-dalna-2pcs.jpg", stockLimit: 35, components: ["1 plate · 2 pieces"] },
  { name: "Paneer Curry", slug: "paneer-curry", description: "Soft paneer in a light, comforting homestyle curry.", price: 50, badge: "1 plate", imageUrl: "/brand/addons/paneer-curry.jpg", stockLimit: 30, components: ["1 plate"] },
  { name: "Paneer Butter Masala", slug: "paneer-butter-masala", description: "Rich, creamy paneer butter masala for a fuller meal.", price: 90, badge: "1 plate", imageUrl: "/brand/addons/paneer-butter-masala.jpg", stockLimit: 25, components: ["1 plate"] },
  { name: "Soyabean Curry", slug: "soyabean-curry", description: "Homestyle soyabean curry with warm Bengali spices.", price: 30, badge: "1 plate", imageUrl: "/brand/addons/soyabean-curry.jpg", stockLimit: 40, components: ["1 plate"] },
  { name: "Plain Tarka", slug: "plain-tarka", description: "Creamy dhaba-style tarka dal with garlic and green chilli.", price: 50, badge: "1 plate", imageUrl: "/brand/addons/plain-tarka.jpg", stockLimit: 35, components: ["1 plate"] },
  { name: "Egg Tarka", slug: "egg-tarka", description: "Comforting tarka dal enriched with freshly cooked egg.", price: 60, badge: "1 plate", imageUrl: "/brand/addons/egg-tarka.jpg", stockLimit: 35, components: ["1 plate"] },
  { name: "Chicken Tarka", slug: "chicken-tarka", description: "A hearty bowl of tarka dal with tender chicken pieces.", price: 100, badge: "1 plate", imageUrl: "/brand/addons/chicken-tarka.jpg", stockLimit: 25, components: ["1 plate"] },
  { name: "Chana Masala", slug: "chana-masala", description: "Slow-cooked chickpeas in a rich, homestyle masala.", price: 50, badge: "1 plate", imageUrl: "/brand/addons/chana-masala.jpg", stockLimit: 40, components: ["1 plate"] }
];

function buildAddOns(mealType: MenuSeed["mealType"]): MenuSeed[] {
  const slugPrefix = mealType === "DINNER" ? "dinner-addon-" : "addon-";
  return addOnDefinitions.map((item) => ({
    ...item,
    slug: `${slugPrefix}${item.slug}`,
    mealType,
    itemKind: "ADD_ON"
  }));
}

export const defaultMenuItems: MenuSeed[] = [
  {
    name: "Mutton Combo",
    slug: "sunday-mutton-combo",
    description: "Sunday’s premium favourite—festive fried rice and rich mutton kosha with a sweet finish.",
    price: 299,
    badge: "Sunday Combo Offer",
    imageUrl: "/brand/sunday-mutton-combo.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 20,
    components: ["Fried rice", "Mutton kosha", "Chutney/sweet aachar", "Papad", "Salad", "Roshogolla"]
  },
  {
    name: "Chicken Combo",
    slug: "sunday-chicken-combo",
    description: "A complete Sunday comfort combo with fried rice, chicken kosha and roshogolla—big value in one plate.",
    price: 179,
    badge: "Sunday Combo Offer",
    imageUrl: "/brand/sunday-chicken-combo.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 25,
    components: ["Fried rice", "Chicken kosha", "Chutney/sweet aachar", "Papad", "Salad", "Roshogolla"]
  },
  {
    name: "Mutton Thali",
    slug: "mutton-thali",
    description: "Rich Bengali mutton kosha for a special lunch.",
    price: 249,
    badge: "Premium",
    imageUrl: "/brand/mutton-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 18,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Mutton Kosha", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Chingri Thali",
    slug: "chingri-thali",
    description: "Light, flavorful and comforting prawn meal.",
    price: 159,
    badge: "Chef’s Pick",
    imageUrl: "/brand/chingri-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 20,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Chingri bhaapa", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Pabda Thali",
    slug: "pabda-thali",
    description: "Authentic Bengali sorshe pabda taste.",
    price: 159,
    badge: "Traditional Favorite",
    imageUrl: "/brand/pabda-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 16,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Sorshe Pabda (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Chicken Thali",
    slug: "chicken-thali",
    description: "Everyday comfort with homestyle chicken curry.",
    price: 149,
    badge: "Most Loved",
    imageUrl: "/brand/chicken-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 24,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Chicken Curry", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Katlaa Macher Thali",
    slug: "katlaa-macher-thali",
    description: "Balanced Bengali fish thali at a great price.",
    price: 139,
    badge: "Value Choice",
    imageUrl: "/brand/katlaa-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 22,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Katla curry (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Rui Macher Thali",
    slug: "rui-macher-thali",
    description: "Classic rui macher kalia, perfect for regular lunch.",
    price: 119,
    badge: "Best Seller",
    imageUrl: "/brand/rui-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 30,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Rui macher kalia (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Egg Thali",
    slug: "egg-thali",
    description: "Simple, filling and affordable home-style meal.",
    price: 99,
    badge: "Budget Favorite",
    imageUrl: "/brand/egg-thali.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 25,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Egg curry (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Veg Thali",
    slug: "veg-thali",
    description: "Fresh vegetarian Bengali meal for everyday eating.",
    price: 89,
    badge: "Light & Comforting",
    imageUrl: "/brand/veg-thali-v2.jpg",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 26,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Special Veg Thali",
    slug: "special-veg-thali",
    description: "Our classic veg thali with paneer curry and dhokar dalna.",
    price: 119,
    badge: "Special Veg",
    imageUrl: "/brand/special-veg-thali.png",
    mealType: "LUNCH",
    itemKind: "THALI",
    stockLimit: 20,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Paneer curry/Dhokar dalna", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Mutton Combo",
    slug: "dinner-sunday-mutton-combo",
    description: "Sunday’s premium favourite—festive fried rice and rich mutton kosha with a sweet finish.",
    price: 299,
    badge: "Sunday Combo Offer",
    imageUrl: "/brand/sunday-mutton-combo.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 20,
    components: ["Fried rice", "Mutton kosha", "Chutney/sweet aachar", "Papad", "Salad", "Roshogolla"]
  },
  {
    name: "Chicken Combo",
    slug: "dinner-sunday-chicken-combo",
    description: "A complete Sunday comfort combo with fried rice, chicken kosha and roshogolla—big value in one plate.",
    price: 179,
    badge: "Sunday Combo Offer",
    imageUrl: "/brand/sunday-chicken-combo.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 25,
    components: ["Fried rice", "Chicken kosha", "Chutney/sweet aachar", "Papad", "Salad", "Roshogolla"]
  },
  {
    name: "Chicken Thali",
    slug: "dinner-chicken-thali",
    description: "Homestyle chicken curry with a comforting Bengali dinner spread.",
    price: 149,
    badge: "Dinner Favourite",
    imageUrl: "/brand/chicken-thali.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 24,
    components: ["Rice", "Moosor daal", "Mochar Ghanto (Banana Flower)", "Chicken Curry (2 pcs)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Katlaa Macher Thali",
    slug: "dinner-katlaa-macher-thali",
    description: "Classic Katla curry served with a fresh Bengali dinner spread.",
    price: 139,
    badge: "Bengali Classic",
    imageUrl: "/brand/katlaa-thali.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 22,
    components: ["Rice", "Moosor daal", "Mochar Ghanto (Banana Flower)", "Katla curry (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Egg Thali",
    slug: "dinner-egg-thali",
    description: "Simple egg curry and Bengali sides for a filling dinner.",
    price: 99,
    badge: "Budget Favourite",
    imageUrl: "/brand/egg-thali.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 25,
    components: ["Rice", "Moosor daal", "Mochar Ghanto (Banana Flower)", "Egg curry (1 pc)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Veg Thali",
    slug: "dinner-veg-thali",
    description: "Light vegetarian Bengali dinner.",
    price: 89,
    badge: "Veg Comfort",
    imageUrl: "/brand/veg-thali-v2.jpg",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 26,
    components: ["Rice", "Moong daal", "Mochar Ghanto (Banana Flower)", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Special Veg Thali",
    slug: "dinner-special-veg-thali",
    description: "Our classic veg dinner thali with paneer curry and dhokar dalna.",
    price: 119,
    badge: "Special Veg",
    imageUrl: "/brand/special-veg-thali.png",
    mealType: "DINNER",
    itemKind: "THALI",
    stockLimit: 20,
    components: ["Rice", "Moong daal", "Mochar Ghanto (Banana Flower)", "Paneer curry/Dhokar dalna", "Chutney/aachar", "Papad", "Salad"]
  },
  ...buildAddOns("LUNCH"),
  ...buildAddOns("DINNER")
];

export const defaultTestimonials = [
  {
    name: "Madhumita, Barrackpore",
    quote: "The food feels like proper ghar-er moto ranna. Fresh, neat, and never oily."
  },
  {
    name: "Anirban, Cantonment area",
    quote: "Slot timing is clear, delivery is on time, and the fish thalis taste properly Bengali."
  },
  {
    name: "Sohini, Chiriamore",
    quote: "Perfect for busy weekdays when you still want home-style lunch without compromise."
  }
];

export const defaultSettings = {
  kitchenLatitude: defaultKitchenCoordinates.latitude,
  kitchenLongitude: defaultKitchenCoordinates.longitude,
  lunchCloseTime: "09:00",
  dinnerOpenTime: "09:30",
  dinnerCloseTime: "18:00",
  freeDeliveryOneKmMin: 99,
  freeDeliveryTwoKmMin: 139,
  aboveTwoKmDeliveryCharge: 29,
  lowOrderDeliveryCharge: 19,
  upiId: "saswatiskitchen@upi",
  qrImageUrl: "/brand/upi-qr.jpg"
};
