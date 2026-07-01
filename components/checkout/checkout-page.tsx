"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LocateFixed, LoaderCircle } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MAX_DELIVERY_DISTANCE_KM, calculateDeliveryCharge, haversineDistanceKm } from "@/lib/delivery";
import type { PaymentProofAnalysis } from "@/lib/payment-proof";
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

type UploadedPaymentProof = {
  url: string;
  fileName: string;
  analysis: PaymentProofAnalysis;
};

const paymentProofTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const paymentProofMaxBytes = 8 * 1024 * 1024;
const paymentProofUploadError =
  "Payment screenshot upload failed. Please try again or use a JPG/PNG/WebP under 8 MB.";

export function CheckoutPage({ settings, slotState }: CheckoutPageProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [slotType, setSlotType] = useState<"LUNCH" | "DINNER">(slotState.activeSlot ?? "LUNCH");
  const [uploadedProof, setUploadedProof] = useState<UploadedPaymentProof | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number; accuracy?: number; source?: "gps" | "address" }>({});
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [confirmationOrderNumber, setConfirmationOrderNumber] = useState<string | null>(null);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const latestUploadRequest = useRef(0);
  const hasLocation =
    Number.isFinite(location.latitude) && Number.isFinite(location.longitude);

  const deliveryPreview = useMemo(() => {
    const distanceKm =
      hasLocation
        ? haversineDistanceKm(
            { lat: settings.kitchenLatitude, lng: settings.kitchenLongitude },
            { lat: location.latitude as number, lng: location.longitude as number }
          )
        : null;

    const deliveryCharge = calculateDeliveryCharge({
      subtotal,
      distanceKm: distanceKm ?? 0,
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
  }, [hasLocation, location.latitude, location.longitude, settings, subtotal]);
  const outOfRange =
    deliveryPreview.distanceKm !== null &&
    deliveryPreview.distanceKm > MAX_DELIVERY_DISTANCE_KM;

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Browser GPS is not available. Please enter your full address.");
      return;
    }

    setError("");
    setLocating(true);

    let bestMatch:
      | { latitude: number; longitude: number; accuracy: number }
      | null = null;
    let finished = false;

    const complete = (nextError?: string) => {
      if (finished) return;
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);
      setLocating(false);

      if (bestMatch) {
        setLocation({
          ...bestMatch,
          source: "gps"
        });
        return;
      }

      if (nextError) {
        setError(nextError);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextMatch = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        if (!bestMatch || nextMatch.accuracy < bestMatch.accuracy) {
          bestMatch = nextMatch;
        }

        if (nextMatch.accuracy <= 35) {
          complete();
        }
      },
      () => {
        complete("Location permission was denied. You can still continue with a full address.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000
      }
    );

    const timeoutId = window.setTimeout(() => {
      complete(
        "We could not lock a precise GPS location yet. Try again near a window or continue with your full address."
      );
    }, 12000);
  }

  useEffect(() => {
    const query = [address.trim(), landmark.trim()].filter(Boolean).join(", ");
    if (query.length < 12) {
      if (location.source === "address") {
        setLocation({});
      }
      return;
    }

    const timeout = window.setTimeout(async () => {
      setAddressLookupLoading(true);
      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, landmark })
        });
        const result = await response.json();
        if (result.ok) {
          setLocation({
            latitude: result.latitude,
            longitude: result.longitude,
            source: "address"
          });
        }
      } finally {
        setAddressLookupLoading(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [address, landmark, location.source]);

  useEffect(() => {
    if (!confirmationOrderNumber) return;

    const timeout = window.setTimeout(() => {
      router.push(`/receipt/${confirmationOrderNumber}`);
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [confirmationOrderNumber, router]);

  async function handlePaymentProofChange(nextFile: File | null) {
    setUploadedProof(null);

    if (!nextFile) {
      return;
    }

    if (!paymentProofTypes.has(nextFile.type)) {
      setError("Please upload a JPG, PNG, or WebP payment screenshot.");
      return;
    }

    if (nextFile.size <= 0 || nextFile.size > paymentProofMaxBytes) {
      setError("Payment screenshot must be smaller than 8 MB.");
      return;
    }

    const uploadRequestId = latestUploadRequest.current + 1;
    latestUploadRequest.current = uploadRequestId;
    setUploadingProof(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", nextFile);

      const uploadResponse = await fetch("/api/uploads/payment-proof", {
        method: "POST",
        body: formData
      });
      const responseText = await uploadResponse.text();
      let uploadResult: { ok?: boolean; url?: string; analysis?: PaymentProofAnalysis; error?: string };

      try {
        uploadResult = JSON.parse(responseText);
      } catch {
        throw new Error(paymentProofUploadError);
      }

      if (!uploadResponse.ok || !uploadResult.ok) {
        throw new Error(uploadResult.error ?? paymentProofUploadError);
      }

      if (!uploadResult.url || !uploadResult.analysis) throw new Error(paymentProofUploadError);

      if (latestUploadRequest.current !== uploadRequestId) {
        return;
      }

      setUploadedProof({
        url: uploadResult.url,
        analysis: uploadResult.analysis,
        fileName: nextFile.name
      });
    } catch (uploadError) {
      if (latestUploadRequest.current === uploadRequestId) {
        setUploadedProof(null);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not upload payment screenshot."
        );
      }
    } finally {
      if (latestUploadRequest.current === uploadRequestId) {
        setUploadingProof(false);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      if (!hasLocation) {
        throw new Error("Tap Locate Me or enter a full address so we can calculate delivery correctly.");
      }

      if (!uploadedProof?.url) {
        throw new Error("Upload your payment screenshot before submitting the order.");
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
          paymentScreenshotUrl: uploadedProof.url,
          paymentProofAnalysis: uploadedProof.analysis,
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

      setSuccessNote("Order placed successfully. Opening your order details…");
      window.localStorage.setItem("saswatis-kitchen-last-order", result.orderNumber);
      clearCart();
      setConfirmationOrderNumber(result.orderNumber);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section-padding w-full max-w-full overflow-hidden">
      <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
          <Card className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Checkout</p>
                <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Finish your order</h1>
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
              <Button type="button" variant="outline" onClick={detectLocation} disabled={locating}>
                {locating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                {locating ? "Locating..." : "Locate Me"}
              </Button>
              <span className="text-sm text-stone-600">{slotState.label}</span>
              {hasLocation ? (
                <span className="rounded-full bg-leaf/10 px-3 py-2 text-xs font-semibold text-leaf">
                  {location.source === "gps" ? "GPS locked" : "Address matched"}
                  {location.accuracy ? ` (±${Math.round(location.accuracy)} m)` : ""}
                </span>
              ) : null}
              {location.accuracy && location.accuracy > 120 ? (
                <span className="text-xs text-stone-500">
                  Accuracy is a bit low. Tap location again near a window for a better delivery estimate.
                </span>
              ) : null}
              {!hasLocation && addressLookupLoading ? (
                <span className="text-xs text-stone-500">Checking delivery distance from your address…</span>
              ) : null}
              {!hasLocation && !addressLookupLoading && !locating ? (
                <span className="text-xs text-stone-500">
                  Tap Locate Me or enter your full address to calculate the exact delivery fee.
                </span>
              ) : null}
              {outOfRange ? (
                <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                  We are coming soon to your location.
                </span>
              ) : null}
            </div>
          </Card>

          {!hasLocation || outOfRange ? null : (
            <Card className="min-w-0 p-4 sm:p-6">
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[24px] border border-border bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Pay exact advance</p>
                  <Image
                    src={settings.qrImageUrl}
                    alt="UPI QR code"
                    width={512}
                    height={512}
                    className="mt-4 h-auto w-full rounded-[24px] border border-border bg-white"
                    sizes="(min-width: 1024px) 24vw, (min-width: 768px) 30vw, 100vw"
                    priority
                    unoptimized
                  />
                  <p className="mt-4 text-sm text-stone-700">UPI ID: {settings.upiId}</p>
                  <p className="mt-2 text-lg font-semibold text-primary">
                    Advance to pay now: {formatCurrency(deliveryPreview.advance)}
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl">Payment proof</p>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    Upload your payment screenshot or attachment. After submission, your order is confirmed and sent to us instantly.
                  </p>
                  <div className="mt-5 space-y-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="block w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                      onChange={(event) => handlePaymentProofChange(event.target.files?.[0] ?? null)}
                      required
                    />
                    {uploadingProof ? (
                      <p className="text-xs text-stone-500">Uploading and checking your screenshot…</p>
                    ) : uploadedProof ? (
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-leaf">Uploaded: {uploadedProof.fileName}</p>
                        <p className="text-leaf">
                          Attachment received. You can submit the order now.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={
              submitting ||
              uploadingProof ||
              locating ||
              addressLookupLoading ||
              items.length === 0 ||
              !slotState.activeSlot ||
              !hasLocation ||
              outOfRange ||
              !uploadedProof?.url
            }
          >
            {submitting || uploadingProof ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit order
          </Button>
        </form>

        <Card className="h-fit min-w-0 p-4 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Order Summary</p>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="min-w-0">
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
              <span>{hasLocation ? formatCurrency(deliveryPreview.deliveryCharge) : "Waiting for location"}</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold">
                {hasLocation ? formatCurrency(deliveryPreview.total) : "Waiting for location"}
              </span>
            </div>
            <div className="flex justify-between text-primary">
              <span>50% advance</span>
              <span className="font-semibold">
                {hasLocation ? formatCurrency(deliveryPreview.advance) : "Waiting for location"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Balance amount</span>
              <span>{hasLocation ? formatCurrency(deliveryPreview.balance) : "Waiting for location"}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance</span>
              <span>
                {deliveryPreview.distanceKm !== null
                  ? `${deliveryPreview.distanceKm.toFixed(2)} km`
                  : "Waiting for location"}
              </span>
            </div>
          </div>
        </Card>
      </div>
      {confirmationOrderNumber ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-border bg-white/95 p-7 text-center shadow-[0_24px_80px_rgba(35,35,35,0.18)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf/10 text-leaf">
              <CircleCheck className="h-8 w-8" />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Order confirmed
            </p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900">
              Your meal request is in.
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Order ID <span className="font-semibold text-stone-900">{confirmationOrderNumber}</span>
              <br />
              Opening your order details now.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
