"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, LoaderCircle } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { calculateDeliveryCharge, haversineDistanceKm } from "@/lib/delivery";
import { buildOrderWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn, formatCurrency } from "@/lib/utils";

type CheckoutPageProps = {
  settings: {
    kitchenLatitude: number;
    kitchenLongitude: number;
    freeDeliveryOneKmMin: number;
    freeDeliveryTwoKmMin: number;
    aboveTwoKmDeliveryCharge: number;
    lowOrderDeliveryCharge: number;
    upiId: string;
    qrImageUrl: string;
  };
  slotState: {
    label: string;
    activeSlot: "LUNCH" | "DINNER" | null;
    lunch: "OPEN" | "CLOSED";
    dinner: "OPEN" | "CLOSED" | "NOT_OPEN";
  };
};

export function CheckoutPage({ settings, slotState }: CheckoutPageProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [slotType, setSlotType] = useState<"LUNCH" | "DINNER">(slotState.activeSlot ?? "LUNCH");
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successNote, setSuccessNote] = useState("");

  const deliveryPreview = useMemo(() => {
    const distanceKm =
      location.latitude && location.longitude
        ? haversineDistanceKm(
            { lat: settings.kitchenLatitude, lng: settings.kitchenLongitude },
            { lat: location.latitude, lng: location.longitude }
          )
        : 0;

    const deliveryCharge = calculateDeliveryCharge({
      subtotal,
      distanceKm,
      freeDeliveryOneKmMin: settings.freeDeliveryOneKmMin,
      freeDeliveryTwoKmMin: settings.freeDeliveryTwoKmMin,
      aboveTwoKmDeliveryCharge: settings.aboveTwoKmDeliveryCharge,
      lowOrderDeliveryCharge: settings.lowOrderDeliveryCharge
    });
    const total = subtotal + deliveryCharge;
    const advance = Math.ceil(total / 2);

    return {
      distanceKm,
      deliveryCharge,
      total,
      advance,
      balance: total - advance
    };
  }, [location, settings, subtotal]);

  async function detectLocation() {
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setError("Location permission was denied. You can still continue with address and landmark.")
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      let paymentScreenshotUrl: string | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("/api/uploads/payment-proof", {
          method: "POST",
          body: formData
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.ok) throw new Error(uploadResult.error);
        paymentScreenshotUrl = uploadResult.url;
      }

      const checkoutToken = crypto.randomUUID();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutToken,
          customerName,
          phone,
          address,
          landmark,
          latitude: location.latitude,
          longitude: location.longitude,
          slotType,
          paymentUtr: utr,
          paymentScreenshotUrl,
          items: items.map((item) => ({
            menuItemId: item.id,
            itemName: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      setSuccessNote("Payment proof received. Please also drop a WhatsApp message for faster confirmation.");
      window.localStorage.setItem("saswatis-kitchen-last-order", result.orderNumber);
      const message = buildOrderWhatsAppMessage({
        orderNumber: result.orderNumber,
        customerName,
        phone,
        slotType,
        totalAmount: result.order.totalAmount ?? deliveryPreview.total,
        advanceAmount: result.order.advanceAmount ?? deliveryPreview.advance,
        items: items.map((item) => ({ name: item.name, quantity: item.quantity }))
      });
      clearCart();
      window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
      router.push(`/receipt/${result.orderNumber}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section-padding">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Checkout</p>
                <h1 className="mt-3 font-serif text-4xl">Finish your order</h1>
              </div>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to home
              </Link>
            </div>

            <p className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary">
              To avoid food wastage, we take 50% advance payment. Balance can be paid on delivery.
            </p>
            {successNote ? (
              <p className="mt-4 rounded-3xl border border-leaf/20 bg-leaf/10 px-4 py-4 text-sm text-leaf">
                {successNote}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input placeholder="Customer name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
              <Input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input placeholder="Landmark" value={landmark} onChange={(event) => setLandmark(event.target.value)} />
              <select
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm"
                value={slotType}
                onChange={(event) => setSlotType(event.target.value as "LUNCH" | "DINNER")}
              >
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
              </select>
            </div>
            <div className="mt-4">
              <Textarea placeholder="Full address" value={address} onChange={(event) => setAddress(event.target.value)} required />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={detectLocation}>
                <LocateFixed className="mr-2 h-4 w-4" />
                Use current location
              </Button>
              <span className="text-sm text-stone-600">{slotState.label}</span>
              {location.latitude && location.longitude ? (
                <span className="rounded-full bg-leaf/10 px-3 py-2 text-xs font-semibold text-leaf">
                  Location captured
                </span>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[24px] border border-border bg-white p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Pay exact advance</p>
                <Image
                  src={settings.qrImageUrl}
                  alt="UPI QR code"
                  width={512}
                  height={512}
                  className="mt-4 rounded-[24px] border border-border bg-white"
                />
                <p className="mt-4 text-sm text-stone-700">UPI ID: {settings.upiId}</p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  Advance to pay now: {formatCurrency(deliveryPreview.advance)}
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl">Payment proof</p>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Upload payment screenshot and UPI transaction ID / UTR. After payment submission, order status becomes Payment Pending Verification.
                </p>
                <div className="mt-5 space-y-4">
                  <Input placeholder="UPI transaction ID / UTR" value={utr} onChange={(event) => setUtr(event.target.value)} required />
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    required
                  />
                  <p className="text-xs text-stone-500">
                    Payment proof received. Please also drop a WhatsApp message for faster confirmation.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={submitting || items.length === 0 || !slotState.activeSlot}
          >
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit order
          </Button>
        </form>

        <Card className="h-fit p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Order Summary</p>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-stone-500">Qty {item.quantity}</p>
                </div>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            {items.length === 0 ? <p className="text-sm text-stone-500">No items in cart.</p> : null}
          </div>

          <div className="mt-6 space-y-3 rounded-3xl border border-border bg-white p-5 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery charge</span>
              <span>{formatCurrency(deliveryPreview.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold">{formatCurrency(deliveryPreview.total)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>50% advance</span>
              <span className="font-semibold">{formatCurrency(deliveryPreview.advance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance amount</span>
              <span>{formatCurrency(deliveryPreview.balance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance</span>
              <span>{deliveryPreview.distanceKm.toFixed(2)} km</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
