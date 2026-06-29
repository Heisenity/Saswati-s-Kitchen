export type MealType = "LUNCH" | "DINNER";
export type PaymentStatus = "PENDING_VERIFICATION" | "CONFIRMED" | "REJECTED";
export type OrderStatus =
  | "PAYMENT_PENDING_VERIFICATION"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED";

export type MenuSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  badge: string;
  imageUrl: string;
  mealType: MealType;
  stockLimit: number;
  components: string[];
};
