import type { MenuSeed } from "@/types";

export const defaultKitchenAddress =
  "17/c, Panpara 5th Ln, Talpukur, Anandapuri, Barrackpore, West Bengal 700123";
export const defaultKitchenCoordinates = {
  latitude: 22.757527,
  longitude: 88.380229
};

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
    imageUrl: "/brand/veg-thali.jpg",
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
    imageUrl: "/brand/veg-thali.jpg",
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
  {
    name: "Roti",
    slug: "addon-roti",
    description: "Fresh soft roti to add to any meal.",
    price: 5,
    badge: "Add-on",
    imageUrl: "/brand/roti-addon.jpg",
    mealType: "LUNCH",
    itemKind: "ADD_ON",
    stockLimit: 100,
    components: ["1 piece"]
  },
  {
    name: "Extra Rice",
    slug: "addon-extra-rice",
    description: "An extra serving of steamed rice.",
    price: 20,
    badge: "Add-on",
    imageUrl: "/brand/extra-rice.jpg",
    mealType: "LUNCH",
    itemKind: "ADD_ON",
    stockLimit: 60,
    components: ["1 serving"]
  },
  {
    name: "Chicken Curry Plate",
    slug: "addon-chicken-curry-plate",
    description: "Homestyle Bengali chicken curry plate.",
    price: 80,
    badge: "Add-on",
    imageUrl: "/brand/chicken-curry-plate.jpg",
    mealType: "LUNCH",
    itemKind: "ADD_ON",
    stockLimit: 30,
    components: ["Chicken Curry (4 pcs, including leg piece)"]
  },
  {
    name: "Butter Parantha",
    slug: "addon-butter-parantha",
    description: "Golden, flaky Bengali-style butter parantha served warm.",
    price: 10,
    badge: "Add-on",
    imageUrl: "https://pub-9d2bed8b98a0462bb1d4d2a1d7f9fcd6.r2.dev/menu-images/34c96396-0eac-41dd-a2f1-a08c2d77bfed.jpg",
    mealType: "LUNCH",
    itemKind: "ADD_ON",
    stockLimit: 100,
    components: ["1 piece"]
  },
  {
    name: "Roti",
    slug: "dinner-addon-roti",
    description: "Fresh soft roti to add to any meal.",
    price: 5,
    badge: "Add-on",
    imageUrl: "/brand/roti-addon.jpg",
    mealType: "DINNER",
    itemKind: "ADD_ON",
    stockLimit: 100,
    components: ["1 piece"]
  },
  {
    name: "Extra Rice",
    slug: "dinner-addon-extra-rice",
    description: "An extra serving of steamed rice.",
    price: 20,
    badge: "Add-on",
    imageUrl: "/brand/extra-rice.jpg",
    mealType: "DINNER",
    itemKind: "ADD_ON",
    stockLimit: 60,
    components: ["1 serving"]
  },
  {
    name: "Chicken Curry Plate",
    slug: "dinner-addon-chicken-curry-plate",
    description: "Homestyle Bengali chicken curry plate.",
    price: 80,
    badge: "Add-on",
    imageUrl: "/brand/chicken-curry-plate.jpg",
    mealType: "DINNER",
    itemKind: "ADD_ON",
    stockLimit: 30,
    components: ["Chicken Curry (4 pcs, including leg piece)"]
  },
  {
    name: "Butter Parantha",
    slug: "dinner-addon-butter-parantha",
    description: "Golden, flaky Bengali-style butter parantha served warm.",
    price: 10,
    badge: "Add-on",
    imageUrl: "https://pub-9d2bed8b98a0462bb1d4d2a1d7f9fcd6.r2.dev/menu-images/34c96396-0eac-41dd-a2f1-a08c2d77bfed.jpg",
    mealType: "DINNER",
    itemKind: "ADD_ON",
    stockLimit: 100,
    components: ["1 piece"]
  }
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
