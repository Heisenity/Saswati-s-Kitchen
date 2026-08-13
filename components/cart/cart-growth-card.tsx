"use client";

import Image from "next/image";
import { Gift, LoaderCircle, Plus, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { FORTY_EIGHT_HOURS_MS } from "@/lib/browser-cache";
import type { CartRecommendationResult } from "@/lib/cart-recommendations";
import { formatCurrency } from "@/lib/utils";

type RecommendationResponse = CartRecommendationResult & { ok: true };

const recommendationCache = new Map<string, RecommendationResponse>();
const localCacheKey = "saswatis-cart-meal-match-v3";
const localCacheTtlMs = FORTY_EIGHT_HOURS_MS;
const maxCachedMatches = 18;

type StoredRecommendation = {
  cachedAt: number;
  result: RecommendationResponse;
};

function getCachedRecommendation(signature: string) {
  const inMemory = recommendationCache.get(signature);
  if (inMemory) return inMemory;

  try {
    const stored = JSON.parse(window.localStorage.getItem(localCacheKey) ?? "{}") as Record<string, StoredRecommendation>;
    const match = stored[signature];
    if (!match || Date.now() - match.cachedAt > localCacheTtlMs || !match.result?.ok) return null;
    recommendationCache.set(signature, match.result);
    return match.result;
  } catch {
    return null;
  }
}

function cacheRecommendation(signature: string, result: RecommendationResponse) {
  recommendationCache.set(signature, result);

  try {
    const stored = JSON.parse(window.localStorage.getItem(localCacheKey) ?? "{}") as Record<string, StoredRecommendation>;
    const freshEntries = Object.entries(stored)
      .filter(([, entry]) => entry && Date.now() - entry.cachedAt <= localCacheTtlMs)
      .sort(([, left], [, right]) => right.cachedAt - left.cachedAt)
      .slice(0, maxCachedMatches - 1);
    window.localStorage.setItem(localCacheKey, JSON.stringify({
      ...Object.fromEntries(freshEntries),
      [signature]: { cachedAt: Date.now(), result }
    }));
  } catch {
    // Recommendations remain available even if storage is unavailable or full.
  }
}

export function CartGrowthCard({
  distanceKm,
  mealType,
  compact = false,
  variant = "default"
}: {
  distanceKm: number | null;
  mealType?: "LUNCH" | "DINNER";
  compact?: boolean;
  variant?: "default" | "rail";
}) {
  const { items, addItem } = useCart();
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const signature = useMemo(
    () => JSON.stringify({
      cart: items.map(({ id, quantity }) => ({ id, quantity })).sort((a, b) => a.id.localeCompare(b.id)),
      mealType: mealType ?? items[0]?.mealType,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10
    }),
    [distanceKm, items, mealType]
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!items.length) {
      setResult(null);
      setLoading(false);
      return;
    }

    const cached = getCachedRecommendation(signature);
    if (cached) {
      setResult(cached);
      setLoading(false);
      return;
    }

    // Never keep a previous cart's match visible while the current cart is loading.
    setResult(null);
    setLoading(true);
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/cart/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: signature
        });
        const data = await response.json() as RecommendationResponse;
        if (!response.ok || !data.ok || requestId !== requestIdRef.current) return;
        cacheRecommendation(signature, data);
        setResult(data);
      } catch {
        // The cart remains fully usable when personalized recommendations are unavailable.
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [items.length, signature]);

  if (!items.length) return null;

  const bundleItems = result?.bundleIds.flatMap((id) => {
    const item = result.recommendations.find((candidate) => candidate.id === id);
    return item ? [item] : [];
  }) ?? [];

  const isRail = variant === "rail";

  return (
    <section data-testid="cart-growth-card" className="overflow-hidden rounded-[26px] border border-[#dfb06e] bg-gradient-to-br from-[#fff9ed] via-[#fff3dc] to-[#fbe4bd] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
      <div className={compact || isRail ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a24b26]">
            <Sparkles className="h-3.5 w-3.5" /> Smart meal match
          </p>
          {result?.remaining === 0 ? (
            <span className="rounded-full bg-[#327252] px-2.5 py-1 text-[10px] font-bold text-white">FREE DELIVERY</span>
          ) : null}
        </div>

        {loading && !result ? (
          <div className="mt-5 rounded-2xl border border-white/80 bg-white/55 px-4 py-5 text-center" aria-live="polite">
            <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-[#ad5428]" />
            <p className="mt-3 text-sm font-semibold text-[#5d3822]">আপনার খাবারের সঙ্গে</p>
            <p className="mt-1 text-sm text-[#76563c]">সেরা match খুঁজছি…</p>
          </div>
        ) : null}

        {result ? (
          <>
            <h3 className={`mt-3 font-serif font-semibold leading-tight text-[#402817] ${compact || isRail ? "line-clamp-2 text-lg" : "text-2xl sm:text-[28px]"}`}>
              {result.headline}
            </h3>
            <p className={`mt-2 text-xs leading-5 text-[#76563c] sm:text-sm ${isRail ? "line-clamp-2" : ""}`}>{result.supportingCopy}</p>
          </>
        ) : null}

        {!isRail && result ? (
          result.threshold !== null && result.threshold !== undefined ? <div className="mt-4 rounded-2xl border border-white/80 bg-white/65 p-3">
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
          </div> : <p className="mt-4 rounded-2xl border border-white/80 bg-white/65 px-3 py-2.5 text-[11px] leading-5 text-[#76563c]">
            Add your delivery location at checkout to see your exact free-delivery goal.
          </p>
        ) : null}

        {result?.recommendations.length ? (
          <div className={isRail ? "mt-4 -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1" : "mt-5 grid gap-3 sm:grid-cols-2"}>
            {result.recommendations.slice(0, isRail ? 3 : compact ? 3 : 4).map((item) => (
              <article key={item.id} className={isRail ? `${result.recommendations.length === 1 ? "w-full" : "w-[calc(50%-6px)]"} shrink-0 snap-start rounded-2xl border border-white/90 bg-white/85 p-2.5` : compact ? "flex items-center gap-3 rounded-2xl border border-white/90 bg-white/80 p-2.5" : "flex min-h-[174px] flex-col rounded-[24px] border border-white/90 bg-white/85 p-3"}>
                {isRail ? <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-[#f5ead7]"><Image src={item.imageUrl} alt="" width={128} height={96} className="h-full w-full object-contain object-center" sizes="150px" /></div> : !compact ? (
                  <div className="flex h-[128px] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#f5ead7]">
                    <Image src={item.imageUrl} alt="" width={360} height={200} className="h-full w-full object-contain object-center" sizes="(min-width: 640px) 260px, 100vw" />
                  </div>
                ) : null}
                <div className={isRail ? "mt-2" : compact ? "min-w-0 flex-1" : "mt-3 min-w-0"}>
                  {isRail ? <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#a85b32]">{item.pairingRole === "bread" ? "Perfect with gravy" : item.pairingRole === "dessert" ? "Sweet finish" : item.pairingRole === "light_side" ? "Light side" : "Meal companion"}</p> : null}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm font-bold text-[#402817] ${isRail ? "mt-0.5" : ""}`}>{item.name}</p>
                    {compact && !isRail ? <span className="shrink-0 text-xs font-bold text-[#a74320]">{formatCurrency(item.price)}</span> : null}
                  </div>
                  {!isRail && compact ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[#806047]">{item.reason}</p> : null}
                </div>
                <div className={isRail ? "mt-2 flex items-center justify-between" : compact ? "" : "mt-auto flex items-center justify-between pt-3"}>
                  {isRail || !compact ? <span className="text-sm font-bold text-[#a74320]">{formatCurrency(item.price)}</span> : null}
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105"
                    aria-label={`Add ${item.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
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
