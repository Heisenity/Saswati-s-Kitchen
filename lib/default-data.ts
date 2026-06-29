import type { MenuSeed } from "@/types";

export const defaultKitchenAddress =
  "17/c, Panpara 5th Ln, Talpukur, Anandapuri, Barrackpore, West Bengal 700123";
export const defaultKitchenCoordinates = {
  latitude: 22.757527,
  longitude: 88.380229
};

export const defaultMenuItems: MenuSeed[] = [
  {
    name: "Mutton Thali",
    slug: "mutton-thali",
    description: "Rich Bengali mutton kosha for a special lunch.",
    price: 249,
    badge: "Premium",
    imageUrl: "/brand/mutton-thali.jpg",
    mealType: "LUNCH",
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
    stockLimit: 16,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Sorshe Pabda", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Chicken Thali",
    slug: "chicken-thali",
    description: "Everyday comfort with homestyle chicken curry.",
    price: 149,
    badge: "Most Loved",
    imageUrl: "/brand/chicken-thali.jpg",
    mealType: "LUNCH",
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
    stockLimit: 22,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Katla curry", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Rui Macher Thali",
    slug: "rui-macher-thali",
    description: "Classic rui macher kalia, perfect for regular lunch.",
    price: 119,
    badge: "Best Seller",
    imageUrl: "/brand/rui-thali.jpg",
    mealType: "LUNCH",
    stockLimit: 30,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Rui macher kalia", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Egg Thali",
    slug: "egg-thali",
    description: "Simple, filling and affordable home-style meal.",
    price: 99,
    badge: "Budget Favorite",
    imageUrl: "/brand/egg-thali.jpg",
    mealType: "LUNCH",
    stockLimit: 25,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Egg curry", "Chutney/aachar", "Papad", "Salad"]
  },
  {
    name: "Veg Thali",
    slug: "veg-thali",
    description: "Fresh vegetarian Bengali meal for everyday eating.",
    price: 89,
    badge: "Light & Comforting",
    imageUrl: "/brand/veg-thali.jpg",
    mealType: "LUNCH",
    stockLimit: 26,
    components: ["Rice", "Moosor daal", "Aloo potol kosha", "Dhokar dalna / Paneer Curry", "Chutney/aachar", "Papad", "Salad"]
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
