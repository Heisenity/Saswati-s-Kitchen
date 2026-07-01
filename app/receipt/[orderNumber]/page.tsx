import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Card } from "@/components/ui/card";
import { ReceiptActions } from "@/components/receipt/receipt-actions";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { buildOrderWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCurrency, formatDateTime, toDateValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  if (!isDatabaseConfigured()) {
    return notFound();
  }

  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true }
  });

  if (!order) return notFound();

  const whatsappMessage = buildOrderWhatsAppMessage({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    slotType: order.slotType,
    totalAmount: order.totalAmount,
    advanceAmount: order.advanceAmount,
    items: order.items.map((item) => ({ name: item.itemName, quantity: item.quantity }))
  });

  return (
    <>
      <main className="print:hidden">
        <Header />
        <div className="section-padding">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Receipt</p>
              <h1 className="mt-4 font-serif text-4xl">Order confirmed for manual verification</h1>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Detail label="Order ID" value={order.orderNumber} />
                <Detail label="Date / time" value={formatDateTime(order.createdAt)} />
                <Detail label="Customer name" value={order.customerName} />
                <Detail label="Phone" value={normalizePhone(order.phone)} />
                <Detail label="Address" value={order.address} />
                <Detail label="Slot" value={order.slotType} />
                <Detail label="Payment status" value={order.paymentStatus.replaceAll("_", " ")} />
                <Detail label="Order status" value={order.orderStatus.replaceAll("_", " ")} />
              </div>

              <div className="mt-8 rounded-3xl border border-border bg-white p-5">
                <p className="font-semibold">Ordered items</p>
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"
                    >
                      <span>
                        {item.itemName} x{item.quantity}
                      </span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-3 rounded-3xl border border-border bg-[#fff4dc] p-5 text-sm">
                <Summary label="Subtotal" value={formatCurrency(order.subtotal)} />
                <Summary label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />
                <Summary label="Total" value={formatCurrency(order.totalAmount)} />
                <Summary label="Advance paid" value={formatCurrency(order.advanceAmount)} />
                <Summary label="Balance due" value={formatCurrency(order.balanceAmount)} />
              </div>

              <ReceiptActions whatsappUrl={buildWhatsAppUrl(whatsappMessage)} />
            </Card>
          </div>
        </div>
        <Footer />
      </main>

      <main className="hidden print:block bg-white text-black">
        <div className="mx-auto max-w-lg px-8 py-10">
          <div className="flex flex-col items-center text-center">
            <img
              src="/brand/logo.jpg"
              alt="Saswati's Kitchen"
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <p className="mt-4 font-serif text-2xl">Saswati&apos;s Kitchen</p>
            <p className="mt-1 text-sm uppercase tracking-[0.28em] text-stone-500">Receipt</p>
          </div>

          <div className="mt-8 rounded-[24px] border border-stone-300 px-6 py-6">
            <PrintRow label="Order ID" value={order.orderNumber} />
            <PrintRow label="Date" value={formatReceiptDate(order.createdAt)} />
            <PrintRow label="Time" value={formatReceiptTime(order.createdAt)} />
          </div>
        </div>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-muted px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</span>
      <span className="text-sm font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function formatReceiptDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(toDateValue(date));
}

function formatReceiptTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(toDateValue(date));
}
