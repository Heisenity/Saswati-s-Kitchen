import nodemailer from "nodemailer";
import { env, getTelegramChatIds } from "@/lib/env";
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
  latitude?: number | null;
  longitude?: number | null;
  paymentScreenshotUrl?: string | null;
  items?: Array<{ itemName: string; quantity: number; unitPrice?: number; totalPrice?: number }>;
};

function canSendMail() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

async function sendTelegramMessage(message: string) {
  const chatIds = getTelegramChatIds();
  if (!env.telegramBotToken || chatIds.length === 0) return;

  const url = `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`;
  await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      })
    )
  );
}

function buildLocationLine(order: OrderLike) {
  if (!order.latitude || !order.longitude) return null;
  return `Location: https://maps.google.com/?q=${order.latitude},${order.longitude}`;
}

function buildScreenshotLine(url?: string | null) {
  if (!url) return "Payment proof: Not submitted";
  return "Payment proof: Attached separately";
}

async function getAttachmentFile(url: string, orderNumber: string) {
  if (url.startsWith("data:")) {
    const [, mimeType = "application/octet-stream", base64 = ""] =
      url.match(/^data:([^;]+);base64,(.+)$/) ?? [];
    const extension = mimeType.split("/")[1] || "bin";
    return new File([Buffer.from(base64, "base64")], `${orderNumber}-payment-proof.${extension}`, {
      type: mimeType
    });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Attachment fetch failed with ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") || "application/octet-stream";
  const extension = mimeType.split("/")[1] || "bin";
  return new File([bytes], `${orderNumber}-payment-proof.${extension}`, { type: mimeType });
}

async function sendTelegramAttachment(caption: string, url: string, orderNumber: string) {
  const chatIds = getTelegramChatIds();
  if (!env.telegramBotToken || chatIds.length === 0 || !url) return;

  try {
    const file = await getAttachmentFile(url, orderNumber);
    await Promise.allSettled(
      chatIds.map((chatId) => {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", caption.slice(0, 900));
        formData.append("document", file);

        return fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendDocument`, {
          method: "POST",
          body: formData
        });
      })
    );
  } catch (error) {
    console.error("[telegram:payment-proof-send-failed]", {
      orderNumber,
      message: error instanceof Error ? error.message : String(error)
    });
  }
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

export async function sendNewOrderNotification(
  order: OrderLike,
  options?: { manualDeliveryReviewRequired?: boolean }
) {
  const manualDeliveryReviewRequired =
    Boolean(options?.manualDeliveryReviewRequired) || order.distanceKm == null;
  const items =
    order.items?.map((item) => {
      const lineTotal =
        typeof item.totalPrice === "number"
          ? item.totalPrice
          : typeof item.unitPrice === "number"
            ? item.unitPrice * item.quantity
            : null;

      return `- ${item.itemName} x${item.quantity}${lineTotal != null ? ` = ₹${lineTotal}` : ""}`;
    }).join("\n") ?? "Not available";
  const locationLine = buildLocationLine(order);
  const message = [
    manualDeliveryReviewRequired ? "🚨 Manual delivery review required" : "New order placed",
    `Order ID: ${order.orderNumber}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Slot: ${order.slotType}`,
    manualDeliveryReviewRequired ? `Address entered by customer: ${order.address}` : `Address: ${order.address}`,
    `Landmark: ${order.landmark ?? "Not provided"}`,
    manualDeliveryReviewRequired ? "Delivery charge: To be confirmed manually by admin" : null,
    "Items:",
    items,
    `Food subtotal: ₹${order.subtotal}`,
    manualDeliveryReviewRequired ? "Delivery charge: Pending admin confirmation" : `Delivery: ₹${order.deliveryCharge}`,
    `Grand total: ₹${order.totalAmount}`,
    `Advance paid/payable: ₹${order.advanceAmount}`,
    `Balance amount: ₹${order.balanceAmount}`,
    manualDeliveryReviewRequired
      ? "Distance: Pending manual review"
      : `Distance: ${order.distanceKm?.toFixed(2) ?? "0"} km`,
    locationLine,
    buildScreenshotLine(order.paymentScreenshotUrl)
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([
    sendTelegramMessage(message),
    sendEmail("New Saswati's Kitchen order", `<pre>${message}</pre>`)
  ]);
}

export async function sendPaymentProofNotification(
  order: OrderLike,
  analysis?: PaymentProofAnalysis
) {
  const locationLine = buildLocationLine(order);
  const message = [
    "Payment proof uploaded",
    `Order ID: ${order.orderNumber}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    locationLine,
    `Proof check: ${formatPaymentProofAnalysis(analysis)}`,
    buildScreenshotLine(order.paymentScreenshotUrl)
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([
    sendTelegramMessage(message),
    order.paymentScreenshotUrl
      ? sendTelegramAttachment(message, order.paymentScreenshotUrl, order.orderNumber)
      : Promise.resolve(),
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
