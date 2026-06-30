export const MealType = {
  LUNCH: "LUNCH",
  DINNER: "DINNER"
} as const;

export const SlotType = {
  LUNCH: "LUNCH",
  DINNER: "DINNER"
} as const;

export const PaymentStatus = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED"
} as const;

export const OrderStatus = {
  PAYMENT_PENDING_VERIFICATION: "PAYMENT_PENDING_VERIFICATION",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  REJECTED: "REJECTED"
} as const;

export const SenderType = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN"
} as const;

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN"
} as const;

export type MealType = (typeof MealType)[keyof typeof MealType];
export type SlotType = (typeof SlotType)[keyof typeof SlotType];
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export type SenderType = (typeof SenderType)[keyof typeof SenderType];
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
