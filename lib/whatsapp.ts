import { publicEnv } from "@/lib/public-env";

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${publicEnv.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppMessage(input: {
  orderNumber?: string;
  customerName: string;
  phone: string;
  slotType: string;
  totalAmount: number;
  advanceAmount: number;
  items: Array<{ name: string; quantity: number }>;
}) {
  return [
    "Hello Saswati's Kitchen,",
    `Order: ${input.orderNumber ?? "New order"}`,
    `Name: ${input.customerName}`,
    `Phone: ${input.phone}`,
    `Slot: ${input.slotType}`,
    `Items: ${input.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}`,
    `Total: ₹${input.totalAmount}`,
    `Advance paid: ₹${input.advanceAmount}`,
    "Payment proof submitted. Please confirm when verified."
  ].join("\n");
}
