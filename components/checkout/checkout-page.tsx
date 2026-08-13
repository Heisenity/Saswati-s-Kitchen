"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, CircleCheck, Copy, LocateFixed, LoaderCircle, MapPin, Minus, Plus, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CartGrowthCard } from "@/components/cart/cart-growth-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  MAX_DELIVERY_DISTANCE_KM,
  calculateDeliveryCharge,
  haversineDistanceKm
} from "@/lib/delivery";
import type { PaymentProofAnalysis } from "@/lib/payment-proof";
import { cn, formatCurrency } from "@/lib/utils";

type CheckoutPageProps = {
  initialCustomerEmail?: string;
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

type PaymentProofUploadResult = {
  ok?: boolean;
  uploadUrl?: string;
  url?: string;
  analysis?: PaymentProofAnalysis;
  error?: string;
};

type DeliveryQuote =
  | {
      mode: "MANUAL_REVIEW";
      message: string;
    };

const paymentProofMaxBytes = 5 * 1024 * 1024;
const paymentProofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function compressPaymentProof(file: File) {
  if (file.size <= 500 * 1024 || !file.type.startsWith("image/")) return file;

  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.72)
    );
    return blob && blob.size < file.size
      ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
      : file;
  } catch {
    return file;
  }
}

async function parseUploadResponse(response: Response) {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText) as PaymentProofUploadResult;
  } catch {
    return { ok: false };
  }
}

function getCustomerErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("customeremail") || lowerMessage.includes("does not exist")) {
    return "Checkout is being updated right now. Please call or WhatsApp us with your cart, and we will place the order for you.";
  }

  if (lowerMessage.includes("payment screenshot") || lowerMessage.includes("payment proof") || lowerMessage.includes("attachment")) {
    return "We could not upload your payment screenshot. Please choose a clear JPG, PNG, or WebP image under 5 MB and try again.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connect")) {
    return "The connection dropped for a moment. Please check your internet and try again.";
  }

  if (lowerMessage.includes("email")) {
    return "Please enter a valid email address for order updates.";
  }

  if (lowerMessage.includes("phone")) {
    return "Please enter a valid phone number so we can confirm your order.";
  }

  if (lowerMessage.includes("cart is empty")) return "Your cart is empty. Please add an item before checkout.";
  if (lowerMessage.includes("location") || lowerMessage.includes("address")) return message;
  if (message && !message.includes("\"")) return message;

  return "Something went wrong while placing your order. Please try again.";
}

export function CheckoutPage({
  initialCustomerEmail = "",
  settings,
  slotState
}: CheckoutPageProps) {
  const router = useRouter();
  const { items, subtotal, clearCart, setDeliveryDistanceKm, updateQuantity } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
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
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [successNote, setSuccessNote] = useState("");
  const [confirmationOrderNumber, setConfirmationOrderNumber] = useState<string | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [upiCopied, setUpiCopied] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const latestUploadRequest = useRef(0);
  const addressQuery = useMemo(
    () => [address.trim(), landmark.trim()].filter(Boolean).join(", "),
    [address, landmark]
  );
  const hasLocation =
    Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
  const isManualDeliveryReview = deliveryQuote?.mode === "MANUAL_REVIEW";
  const deliveryPreview = useMemo(() => {
    if (isManualDeliveryReview) {
      const advance = Math.ceil(subtotal / 2);

      return {
        distanceKm: null,
        deliveryCharge: 0,
        total: subtotal,
        advance,
        balance: subtotal - advance
      };
    }

    const distanceKm = hasLocation
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
  }, [deliveryQuote, hasLocation, isManualDeliveryReview, location.latitude, location.longitude, location.source, settings, subtotal]);
  const outOfRange =
    deliveryPreview.distanceKm !== null &&
    deliveryPreview.distanceKm > MAX_DELIVERY_DISTANCE_KM;
  function showError(errorMessage: string) {
    setError(errorMessage);
    setErrorPopupOpen(true);
  }

  useEffect(() => {
    setDeliveryDistanceKm(
      !isManualDeliveryReview && !outOfRange ? deliveryPreview.distanceKm : null
    );
  }, [
    deliveryPreview.distanceKm,
    isManualDeliveryReview,
    outOfRange,
    setDeliveryDistanceKm
  ]);

  function detectLocation() {
    if (!navigator.geolocation) {
      showError("Browser GPS is not available. Please enter your full address.");
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
        setAddress((current) => current.trim() || "Current GPS location");
        setDeliveryQuote(null);
        setAddressSheetOpen(false);
        return;
      }

      if (nextError) {
        showError(nextError);
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
    if (!confirmationOrderNumber) return;

    const timeout = window.setTimeout(() => {
      router.push(`/receipt/${confirmationOrderNumber}`);
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [confirmationOrderNumber, router]);

  function resolveAddressLocation() {
    if (addressQuery.length < 8) {
      return;
    }

    setError("");
    setLocation({});
    setDeliveryQuote({
      mode: "MANUAL_REVIEW",
      message:
        "Prefer not to share live location? Place the order now with just the meal advance. Our team will confirm delivery charges manually after checkout."
    });
    setAddressSheetOpen(false);
  }

  async function handlePaymentProofChange(nextFile: File | null) {
    setUploadedProof(null);
    setSuccessNote("");

    if (!nextFile) {
      return;
    }

    if (nextFile.size <= 0 || nextFile.size > paymentProofMaxBytes) {
      showError("Please use a payment screenshot smaller than 5 MB.");
      return;
    }
    if (!paymentProofTypes.has(nextFile.type)) {
      showError("Please use a JPG, PNG, or WebP payment screenshot.");
      return;
    }

    const preparedFile = await compressPaymentProof(nextFile);

    const uploadRequestId = latestUploadRequest.current + 1;
    latestUploadRequest.current = uploadRequestId;
    setUploadingProof(true);
    setError("");

    try {
      let uploadResult: PaymentProofUploadResult;

      try {
        const uploadResponse = await fetch("/api/uploads/payment-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: preparedFile.name,
            contentType: preparedFile.type,
            size: preparedFile.size
          })
        });
        uploadResult = await parseUploadResponse(uploadResponse);

        if (!uploadResponse.ok || !uploadResult.ok || !uploadResult.uploadUrl || !uploadResult.url || !uploadResult.analysis) {
          throw new Error(uploadResult.error || "Could not prepare payment screenshot upload.");
        }

        const r2Response = await fetch(uploadResult.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": preparedFile.type },
          body: preparedFile
        });
        if (!r2Response.ok) {
          throw new Error("R2 browser upload failed.");
        }
      } catch (r2UploadError) {
        console.warn("[payment-proof:r2-browser-upload-fallback]", r2UploadError);
        const formData = new FormData();
        formData.append("file", preparedFile);
        const fallbackResponse = await fetch("/api/uploads/payment-proof", {
          method: "POST",
          body: formData
        });
        uploadResult = await parseUploadResponse(fallbackResponse);
        if (!fallbackResponse.ok || !uploadResult.ok || !uploadResult.url || !uploadResult.analysis) {
          throw new Error(uploadResult.error || "Could not upload payment screenshot. Please try once more.");
        }
      }

      if (latestUploadRequest.current !== uploadRequestId) {
        return;
      }

      setUploadedProof({
        url: uploadResult.url,
        analysis: uploadResult.analysis,
        fileName: nextFile.name
      });
    } catch (uploadError) {
      console.error("[payment-proof:browser-upload-failed]", uploadError);
      if (latestUploadRequest.current === uploadRequestId) {
        setUploadedProof(null);
        showError(getCustomerErrorMessage(uploadError));
      }
    } finally {
      if (latestUploadRequest.current === uploadRequestId) {
        setUploadingProof(false);
      }
    }
  }

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(settings.upiId);
      setUpiCopied(true);
      window.setTimeout(() => setUpiCopied(false), 1500);
    } catch {
      showError("Could not copy the UPI ID. You can still copy it manually.");
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

      if (!hasLocation && !isManualDeliveryReview) {
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
          manualDeliveryReviewRequired: isManualDeliveryReview,
          deliveryChargeStatus: isManualDeliveryReview ? "PENDING_ADMIN_REVIEW" : undefined,
          customerName,
          customerEmail,
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
            unitPrice: item.price,
            customization: item.customization ?? undefined
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
      showError(getCustomerErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const locationLabel = hasLocation
    ? `${location.source === "gps" ? "Current location" : "Saved address"}${deliveryPreview.distanceKm !== null ? ` · ${deliveryPreview.distanceKm.toFixed(1)} km away` : ""}`
    : isManualDeliveryReview
      ? "Address saved · delivery charge confirmed after order"
      : "Use current location or enter manually";

  const checkoutReady =
    !submitting && !uploadingProof && !locating && items.length > 0 && Boolean(slotState.activeSlot) &&
    (hasLocation || isManualDeliveryReview) && !outOfRange && Boolean(uploadedProof?.url);

  return (
    <div className="section-padding w-full max-w-full overflow-hidden">
      <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form id="checkout-form" onSubmit={handleSubmit} className="order-2 min-w-0 space-y-6 pb-20 lg:order-1 lg:pb-0">
          <Card className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Fast checkout</p>
                <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Order without login</h1>
              </div>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to home
              </Link>
            </div>

            <div className="mt-5 rounded-3xl border border-border bg-muted px-4 py-4 text-sm text-stone-600">
              <p className="font-semibold text-foreground">No account needed.</p>
              <p className="mt-1">Add your phone and email, place the order, and track it later with your order ID.</p>
              <Link
                href="/auth/login?provider=google&next=%2Fcheckout&mode=user"
                className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full sm:w-auto")}
              >
                Continue with Google
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
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input placeholder="Customer name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
              <Input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </div>
            <div className="mt-4">
              <Input
                type="email"
                placeholder="Email for order updates"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                required
              />
            </div>
            <div className="mt-4 hidden grid gap-4 md:grid-cols-2 sm:grid">
              <Input placeholder="Landmark" value={landmark} onChange={(event) => setLandmark(event.target.value)} />
              <select className="h-12 rounded-2xl border border-border bg-white px-4 text-sm" value={slotType} onChange={(event) => setSlotType(event.target.value as "LUNCH" | "DINNER")}><option value="LUNCH">Lunch</option><option value="DINNER">Dinner</option></select>
              <div className="md:col-span-2"><Textarea placeholder="Full address" value={address} onChange={(event) => setAddress(event.target.value)} required /><div className="mt-3 flex items-center gap-3"><Button type="button" size="sm" variant="outline" onClick={detectLocation} disabled={locating}>{locating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}{locating ? "Locating..." : "Locate Me"}</Button><Button type="button" size="sm" variant="outline" onClick={resolveAddressLocation}>Use this address</Button></div></div>
            </div>
          </Card>

          {(!hasLocation && !isManualDeliveryReview) || outOfRange ? null : (
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
                    unoptimized
                  />
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-700">
                    <p>UPI ID: {settings.upiId}</p>
                    <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3" onClick={copyUpiId}>
                      {upiCopied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                      {upiCopied ? "Copied" : "Copy"}
                    </Button>
                  </div>
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
                    <p className="text-xs text-stone-500">JPG, PNG, or WebP smaller than 5 MB.</p>
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
            className="hidden w-full sm:flex"
            size="lg"
            disabled={
              !checkoutReady
            }
          >
            {submitting || uploadingProof ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit order
          </Button>
        </form>

        <Card data-testid="checkout-summary" className="order-1 h-fit min-w-0 p-4 sm:p-6 lg:order-2 lg:sticky lg:top-24">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Order Summary</p>
          <div className="mt-5">
            <CartGrowthCard
              distanceKm={outOfRange ? null : deliveryPreview.distanceKm}
              mealType={slotType}
              variant="rail"
            />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:hidden">Your order</p>
          <div className="mt-3 space-y-3 sm:mt-5 sm:space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-stone-500">{formatCurrency(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2 sm:hidden"><button type="button" className="grid h-7 w-7 place-items-center rounded-full border border-border" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Remove one ${item.name}`}><Minus className="h-3.5 w-3.5" /></button><span className="min-w-5 text-center text-xs font-semibold">{item.quantity}</span><button type="button" className="grid h-7 w-7 place-items-center rounded-full border border-border" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Add one ${item.name}`}><Plus className="h-3.5 w-3.5" /></button></div>
                </div>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            {items.length === 0 ? <p className="text-sm text-stone-500">No items in cart.</p> : null}
          </div>

          <div className="mt-6 space-y-3 sm:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Delivery details</p>
            <button type="button" onClick={() => setAddressSheetOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4 text-left shadow-[0_1px_0_rgba(255,255,255,.9)]">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{hasLocation || isManualDeliveryReview ? "Delivery to" : "Add delivery address"}</span><span className="mt-0.5 block text-xs leading-5 text-stone-500">{hasLocation || isManualDeliveryReview ? locationLabel : "Tap Locate Me to see delivery options and your exact fee."}</span></span>
              <ChevronRight className="h-5 w-5 text-stone-400" />
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,.9)]">
              <span className="text-lg">🕐</span><span className="flex-1 text-sm font-semibold">Delivery slot</span>
              <select className="bg-transparent text-right text-sm text-stone-600 outline-none" value={slotType} onChange={(event) => setSlotType(event.target.value as "LUNCH" | "DINNER")}><option value="LUNCH">Lunch</option><option value="DINNER">Dinner</option></select>
            </div>
            {outOfRange ? <p className="rounded-2xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">We look forward to serving your area soon.</p> : null}
          </div>

          <div className="mt-6 space-y-3 rounded-3xl border border-border bg-white p-5 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery charge</span>
              <span>
                {isManualDeliveryReview ? "Confirmed after order" : hasLocation ? formatCurrency(deliveryPreview.deliveryCharge) : "Add delivery address"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold">
                {isManualDeliveryReview || hasLocation ? formatCurrency(deliveryPreview.total) : formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-primary">
              <span>50% advance</span>
              <span className="font-semibold">
                {isManualDeliveryReview || hasLocation ? formatCurrency(deliveryPreview.advance) : formatCurrency(Math.ceil(subtotal / 2))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Balance amount</span>
              <span>
                {isManualDeliveryReview || hasLocation ? formatCurrency(deliveryPreview.balance) : formatCurrency(subtotal - Math.ceil(subtotal / 2))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Distance</span>
              <span>
                {isManualDeliveryReview
                  ? "Will be confirmed by admin"
                  : deliveryPreview.distanceKm !== null
                  ? `${deliveryPreview.distanceKm.toFixed(2)} km`
                  : "Choose GPS or manual address"}
              </span>
            </div>
            {isManualDeliveryReview ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
                For the fastest exact quote, tap Locate Me. Otherwise, reserve your meal now and our team will confirm delivery charges personally after checkout.
              </p>
            ) : null}
          </div>

        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6d5c2] bg-[#fffaf5]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Button type="submit" form="checkout-form" className="h-12 w-full justify-between px-5" disabled={!checkoutReady}>
          <span>{formatCurrency(isManualDeliveryReview || hasLocation ? deliveryPreview.advance : Math.ceil(subtotal / 2))} advance</span><span>Continue <ChevronRight className="ml-1 inline h-4 w-4" /></span>
        </Button>
      </div>
      {addressSheetOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-stone-950/40 sm:hidden" role="dialog" aria-modal="true" aria-label="Delivery address">
          <button type="button" aria-label="Close address form" className="absolute inset-0" onClick={() => setAddressSheetOpen(false)} />
          <section className="relative w-full rounded-t-[30px] bg-[#fffaf5] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Delivery location</p><h2 className="mt-1 font-serif text-2xl text-foreground">Where should we deliver?</h2></div><button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-border" onClick={() => setAddressSheetOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button></div>
            <Button type="button" variant="outline" className="mt-5 h-auto w-full justify-start rounded-2xl px-4 py-4 text-left" onClick={detectLocation} disabled={locating}>{locating ? <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-primary" /> : <LocateFixed className="mr-3 h-5 w-5 text-primary" />}<span><span className="block font-semibold">Use my current location</span><span className="mt-1 block text-xs font-normal text-stone-500">See delivery availability and your exact fee instantly</span></span></Button>
            <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <p className="text-sm font-semibold text-foreground">Enter address manually</p>
            <Textarea className="mt-3" placeholder="Full address" value={address} onChange={(event) => { setAddress(event.target.value); if (!event.target.value.trim()) setDeliveryQuote(null); }} />
            <Input className="mt-3" placeholder="Landmark / flat number (optional)" value={landmark} onChange={(event) => setLandmark(event.target.value)} />
            <Button type="button" className="mt-4 w-full" onClick={resolveAddressLocation} disabled={addressQuery.length < 8}>Save address</Button>
            {deliveryQuote ? <p className="mt-3 rounded-2xl bg-leaf/10 px-3 py-2 text-xs leading-5 text-leaf">{deliveryQuote.message}</p> : null}
          </section>
        </div>
      ) : null}
      {error && errorPopupOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="checkout-error-title"
        >
          <div className="w-full max-w-md rounded-[28px] border border-primary/20 bg-white p-6 shadow-2xl">
            <p id="checkout-error-title" className="font-serif text-2xl text-foreground">
              Please check this
            </p>
            <p className="mt-3 text-sm leading-7 text-stone-600">{error}</p>
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => setErrorPopupOpen(false)}
            >
              OK
            </Button>
          </div>
        </div>
      ) : null}
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
