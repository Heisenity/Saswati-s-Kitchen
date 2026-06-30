import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { formatPaymentProofAnalysis, type PaymentProofAnalysis } from "@/lib/payment-proof";

type OrderLike = {
  orderNumber: string;
  customerName: string;
  phone: string;
  slotType: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  distanceKm?: number | null;
  address: string;
  landmark?: string | null;
  paymentScreenshotUrl?: string | null;
  items?: Array<{ itemName: string; quantity: number }>;
};

function canSendMail() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

async function sendTelegramMessage(message: string) {
  if (!env.telegramBotToken || !env.telegramChatId) return;

  const url = `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.telegramChatId,
      text: message
    })
  }).catch(() => null);
}

async function sendEmail(subject: string, html: string) {
  if (!canSendMail()) return;

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: env.smtpUser,
    subject,
    html
  });
}

export async function sendNewOrderNotification(order: OrderLike) {
  const items = order.items?.map((item) => `${item.itemName} x${item.quantity}`).join(", ") ?? "";
  const message = [
    "New order placed",
    `Order ID: ${order.orderNumber}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Slot: ${order.slotType}`,
    `Items: ${items}`,
    `Subtotal: ₹${order.subtotal}`,
    `Delivery: ₹${order.deliveryCharge}`,
    `Total: ₹${order.totalAmount}`,
    `Advance: ₹${order.advanceAmount}`,
    `Balance: ₹${order.balanceAmount}`,
    `Distance: ${order.distanceKm?.toFixed(2) ?? "0"} km`,
    `Address: ${order.address}`,
    `Screenshot: ${order.paymentScreenshotUrl ?? "Not submitted"}`
  ].join("\n");

  await Promise.all([
    sendTelegramMessage(message),
    sendEmail("New Saswati's Kitchen order", `<pre>${message}</pre>`)
  ]);
}

export async function sendPaymentProofNotification(
  order: OrderLike,
  analysis?: PaymentProofAnalysis
) {
  const message = [
    "Payment proof uploaded",
    `Order ID: ${order.orderNumber}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Proof check: ${formatPaymentProofAnalysis(analysis)}`,
    `Screenshot: ${order.paymentScreenshotUrl ?? "Not submitted"}`
  ].join("\n");

  await Promise.all([
    sendTelegramMessage(message),
    sendEmail("Payment proof uploaded", `<pre>${message}</pre>`)
  ]);
}

export async function sendOfflineChatNotification(input: {
  customerName: string;
  phone: string;
  message: string;
  orderNumber?: string | null;
}) {
  const text = [
    "New customer chat while admin offline",
    `Name: ${input.customerName}`,
    `Phone: ${input.phone}`,
    `Order ID: ${input.orderNumber ?? "General support"}`,
    `Message: ${input.message}`
  ].join("\n");

  await Promise.all([
    sendTelegramMessage(text),
    sendEmail("Offline chat alert", `<pre>${text}</pre>`)
  ]);
}
