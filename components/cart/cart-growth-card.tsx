"use client";

import Image from "next/image";
import { Gift, LoaderCircle, Plus, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import type { CartRecommendationResult } from "@/lib/cart-recommendations";
import { getCustomizationOptions } from "@/lib/cart-customization";
import { formatCurrency } from "@/lib/utils";

type RecommendationResponse = CartRecommendationResult & { ok: true };

const recommendationCache = new Map<string, RecommendationResponse>();

export function CartItemCustomization({ item }: { item: CartItem }) {
  const { updateCustomization } = useCart();
  const options = getCustomizationOptions(item.name);
  if (!options.length) return null;

  return (
    <label className="mt-3 block text-xs text-stone-600">
      <span className="font-semibold text-stone-700">Kitchen preference</span>
      <select
        value={item.customization ?? "Regular"}
        onChange={(event) => updateCustomization(
          item.id,
          event.target.value === "Regular" ? null : event.target.value
        )}
        className="mt-1.5 h-9 w-full rounded-xl border border-[#e5d4c2] bg-white px-3 text-xs text-stone-800 outline-none focus:border-primary"
        aria-label={`Kitchen preference for ${item.name}`}
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <span className="mt-1 block text-[10px] leading-4 text-stone-500">We’ll follow your request wherever today’s preparation allows.</span>
    </label>
  );
}

export function CartGrowthCard({
  distanceKm,
  mealType,
  compact = false
}: {
  distanceKm: number | null;
  mealType?: "LUNCH" | "DINNER";
  compact?: boolean;
}) {
  const { items, addItem } = useCart();
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const signature = useMemo(
    () => JSON.stringify({
      cart: items.map(({ id, quantity }) => ({ id, quantity })).sort((a, b) => a.id.localeCompare(b.id)),
      mealType: mealType ?? items[0]?.mealType,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10
    }),
    [distanceKm, items, mealType]
  );

  useEffect(() => {
    if (!items.length) {
      setResult(null);
      return;
    }

    const cached = recommendationCache.get(signature);
    if (cached) {
      setResult(cached);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/cart/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: signature
        });
        const data = await response.json() as RecommendationResponse;
        if (!response.ok || !data.ok) return;
        recommendationCache.set(signature, data);
        setResult(data);
      } catch {
        // The cart remains fully usable when personalized recommendations are unavailable.
      } finally {
        setLoading(false);
      }
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [items.length, signature]);

  if (!items.length) return null;

  const bundleItems = result?.bundleIds.flatMap((id) => {
    const item = result.recommendations.find((candidate) => candidate.id === id);
    return item ? [item] : [];
  }) ?? [];

  return (
    <section data-testid="cart-growth-card" className="overflow-hidden rounded-[26px] border border-[#dfb06e] bg-gradient-to-br from-[#fff9ed] via-[#fff3dc] to-[#fbe4bd] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
      <div className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a24b26]">
            <Sparkles className="h-3.5 w-3.5" /> Smart meal match
          </p>
          {result?.remaining === 0 ? (
            <span className="rounded-full bg-[#327252] px-2.5 py-1 text-[10px] font-bold text-white">FREE DELIVERY</span>
          ) : null}
        </div>

        <h3 className={`mt-3 font-serif font-semibold leading-tight text-[#402817] ${compact ? "text-xl" : "text-2xl sm:text-[28px]"}`}>
          {result?.headline ?? "Delivery charge নয়—টাকাটা খাবারেই থাক"}
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#76563c] sm:text-sm">
          {result?.supportingCopy ?? "আপনার cart দেখে আজকের খাবারের সঙ্গে মানানসই কিছু খুঁজছি…"}
        </p>

        {result?.threshold !== null && result?.threshold !== undefined ? (
          <div className="mt-4 rounded-2xl border border-white/80 bg-white/65 p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#68462d]"><Truck className="h-4 w-4 text-[#b35b2d]" /> Free-delivery goal</span>
              <span className="text-[#9f421f]">{formatCurrency(result.subtotal)} / {formatCurrency(result.threshold)}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#ead3b4]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#b51e1e] via-[#cf672d] to-[#e5a43f] transition-[width] duration-500"
                style={{ width: `${result.progress ?? 0}%` }}
              />
            </div>
            {result.remaining && result.remaining > 0 ? (
              <p className="mt-2 text-[11px] leading-4 text-[#76563c]">
                আর {formatCurrency(result.remaining)} খাবার যোগ করলে বর্তমান {formatCurrency(result.deliveryFee ?? 0)} delivery charge বাঁচবে।
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-white/80 bg-white/65 px-3 py-2.5 text-[11px] leading-5 text-[#76563c]">
            Checkout-এ location দিলে আপনার exact free-delivery goal দেখাব।
          </p>
        )}

        {loading && !result ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-[#76563c]"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Matching your meal…</p>
        ) : null}

        {result?.recommendations.length ? (
          <div className="mt-4 space-y-2.5">
            {result.recommendations.slice(0, compact ? 3 : 4).map((item) => (
              <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/80 p-2.5">
                {!compact ? (
                  <Image src={item.imageUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-xl object-cover" sizes="56px" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[#402817]">{item.name}</p>
                    <span className="shrink-0 text-xs font-bold text-[#a74320]">{formatCurrency(item.price)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[#806047]">{item.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(item)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105"
                  aria-label={`Add ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {bundleItems.length > 1 && result ? (
          <Button
            type="button"
            className="mt-4 w-full bg-[#402817] text-white hover:bg-[#5b3820]"
            onClick={() => bundleItems.forEach((item) => addItem(item))}
          >
            <Gift className="mr-2 h-4 w-4" /> Add the matched set · {formatCurrency(result.bundleTotal)}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
