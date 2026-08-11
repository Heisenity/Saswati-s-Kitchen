"use client";

import Link from "next/link";
import Image from "next/image";
import { LocateFixed, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MAX_DELIVERY_DISTANCE_KM,
  calculateDeliveryCharge,
  getDeliverySlab,
  haversineDistanceKm
} from "@/lib/delivery";
import { formatCurrency } from "@/lib/utils";

type MenuSectionProps = {
  kitchenLocation: {
    latitude: number;
    longitude: number;
  };
  items: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    badge: string;
    imageUrl: string;
    mealType: "LUNCH" | "DINNER";
    itemKind: "THALI" | "ADD_ON";
    components: Array<{ itemName: string }>;
  }>;
};

type VisibleMealType = "LUNCH" | "DINNER";

export function MenuSection({ items, kitchenLocation }: MenuSectionProps) {
  const { setAvailableAddOns, setDeliveryDistanceKm } = useCart();
  const [mealType, setMealType] = useState<VisibleMealType>("LUNCH");
  const thalis = items
    .filter((item) => item.itemKind === "THALI" && item.mealType === mealType)
    .sort((a, b) => Number(b.badge.includes("Combo Offer")) - Number(a.badge.includes("Combo Offer")));
  const addOns = items.filter((item) => item.itemKind === "ADD_ON" && item.mealType === mealType);

  useEffect(() => {
    setAvailableAddOns(
      [...thalis, ...addOns].map(({ id, name, price, imageUrl, badge, itemKind, mealType, description, components }) => ({
        id,
        name,
        price,
        imageUrl,
        badge,
        itemKind,
        mealType,
        description,
        components: components.map(({ itemName }) => itemName)
      }))
    );
  }, [items, mealType, setAvailableAddOns]);

  useEffect(() => {
    const requestedMenu = new URLSearchParams(window.location.search).get("menu")?.toUpperCase();
    if (requestedMenu === "LUNCH" || requestedMenu === "DINNER") setMealType(requestedMenu);

    function changeMenu(event: Event) {
      const nextMealType = (event as CustomEvent<VisibleMealType>).detail;
      if (nextMealType === "LUNCH" || nextMealType === "DINNER") setMealType(nextMealType);
    }

    window.addEventListener("menu-filter", changeMenu);
    return () => window.removeEventListener("menu-filter", changeMenu);
  }, []);

  return (
    <section id="menu" className="section-padding w-full max-w-full overflow-hidden pb-28 md:pb-16">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="hidden flex-col gap-5 md:flex lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">
              Today’s {mealType === "LUNCH" ? "Lunch" : "Dinner"} Menu
            </p>
            <h2 className="mt-3 font-serif text-4xl">
              {mealType === "LUNCH" ? "Lunch" : "Dinner"} thalis made for daily comfort
            </h2>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="inline-flex w-fit rounded-full border border-border bg-white p-1 shadow-sm" aria-label="Choose menu">
              {(["LUNCH", "DINNER"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={mealType === type}
                  onClick={() => setMealType(type)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    mealType === type ? "bg-primary text-white shadow-sm" : "text-stone-600 hover:bg-muted"
                  }`}
                >
                  {type === "LUNCH" ? "Lunch" : "Dinner"}
                </button>
              ))}
            </div>
            <p className="max-w-lg text-sm leading-7 text-stone-600">
              Cooked fresh daily in limited batches for freshness.
            </p>
          </div>
          <MobileLocationQuote
            kitchenLocation={kitchenLocation}
            onDistanceChange={setDeliveryDistanceKm}
          />
        </div>

        <div className="md:hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Freshly cooked today</p>
              <h2 className="mt-1 font-serif text-3xl">Today’s {mealType === "LUNCH" ? "Lunch" : "Dinner"}</h2>
            </div>
            <p className="pb-1 text-right text-xs text-stone-500">Limited batches</p>
          </div>
          <div className="mt-5 grid grid-cols-2 rounded-2xl border border-border bg-white p-1" aria-label="Choose menu">
            {(["LUNCH", "DINNER"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={mealType === type}
                onClick={() => setMealType(type)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  mealType === type ? "bg-primary text-white shadow-sm" : "text-stone-600"
                }`}
              >
                {type === "LUNCH" ? "Lunch" : "Dinner"}
              </button>
            ))}
          </div>
        </div>

        <div key={mealType} className="mt-5 divide-y divide-border/80 md:mt-10 md:hidden animate-[menu-fade_.28s_ease-out]">
          {thalis.map((item) => <MobileMenuRow item={item} key={item.id} />)}
        </div>

        <div key={`desktop-${mealType}`} className="mt-10 hidden min-w-0 grid-cols-1 gap-6 md:grid md:grid-cols-2 xl:grid-cols-3 animate-[menu-fade_.28s_ease-out]">
          {thalis.map((item) => (
            <MenuCard item={item} key={item.id} />
          ))}
        </div>

        {addOns.length ? (
          <div className="mt-8 border-t border-border pt-6 md:mt-14 md:pt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">Customise your meal</p>
            <h3 className="mt-1 font-serif text-2xl md:mt-3 md:text-3xl">Add a little extra</h3>
            <div data-testid="mobile-addon-list" key={`mobile-addons-${mealType}`} className="mt-3 divide-y divide-border/80 md:hidden animate-[menu-fade_.28s_ease-out]">
              {addOns.map((item) => <MobileMenuRow item={item} key={item.id} />)}
            </div>
            <div data-testid="desktop-addon-list" key={`desktop-addons-${mealType}`} className="mt-7 hidden min-w-0 grid-cols-1 gap-6 md:grid md:grid-cols-2 xl:grid-cols-3 animate-[menu-fade_.28s_ease-out]">
              {addOns.map((item) => (
                <MenuCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <MobileCartBar />
    </section>
  );
}

function getCartItem(item: MenuSectionProps["items"][number]) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    badge: item.badge,
    mealType: item.mealType,
    itemKind: item.itemKind,
    description: item.description,
    components: item.components.map(({ itemName }) => itemName)
  };
}

function getFoodMarker(item: MenuSectionProps["items"][number]) {
  const content = [item.name, item.description, ...item.components.map(({ itemName }) => itemName)]
    .join(" ")
    .toLowerCase();

  if (/\b(egg|chicken|mutton|fish|pabda|katla|rui|chingri|prawn|meat|mach)\b/.test(content)) {
    return { label: "Non-vegetarian", className: "border-primary bg-primary" };
  }

  if (/\b(veg|vegetarian|paneer|dhok|roti|rice|parantha|papad|dal|daal|sabzi|vegetable|aloo|bhindi|chana|soyabean|sewai|tarka)\b/.test(content)) {
    return { label: "Vegetarian", className: "border-leaf bg-leaf" };
  }

  return null;
}

function FoodMarker({ item }: { item: MenuSectionProps["items"][number] }) {
  const marker = getFoodMarker(item);
  if (!marker) return null;

  return (
    <span className={`inline-grid h-5 w-5 place-items-center rounded-[5px] border ${marker.className}`} title={marker.label} aria-label={marker.label}>
      <span className="h-2 w-2 rounded-full bg-white" />
    </span>
  );
}

function MobileLocationQuote({
  kitchenLocation,
  onDistanceChange
}: {
  kitchenLocation: MenuSectionProps["kitchenLocation"];
  onDistanceChange: (distanceKm: number | null) => void;
}) {
  const { subtotal } = useCart();
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("Tap to see your delivery fee.");
  const outOfRange = distanceKm !== null && distanceKm > MAX_DELIVERY_DISTANCE_KM;
  const deliverySlab = distanceKm === null ? null : getDeliverySlab(distanceKm);
  const deliveryFee = useMemo(
    () => calculateDeliveryCharge({ subtotal, distanceKm: distanceKm ?? 0 }),
    [distanceKm, subtotal]
  );

  function detectLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser. You can enter your address at checkout.");
      return;
    }

    setLocating(true);
    setMessage("Getting your delivery location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextDistance = haversineDistanceKm(
          { lat: kitchenLocation.latitude, lng: kitchenLocation.longitude },
          { lat: position.coords.latitude, lng: position.coords.longitude }
        );
        setDistanceKm(nextDistance);
        onDistanceChange(nextDistance <= MAX_DELIVERY_DISTANCE_KM ? nextDistance : null);
        setLocating(false);
        setMessage(
          nextDistance > MAX_DELIVERY_DISTANCE_KM
            ? "We are coming soon to your location."
            : `Delivery location found (±${Math.round(position.coords.accuracy)} m).`
        );
      },
      () => {
        setLocating(false);
        setMessage("Location permission was denied. You can enter your address at checkout.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
  }

  return (
    <div className="mt-5 border-y border-border/80 py-3.5 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Deliver to your location</p>
            <p className="truncate text-xs text-stone-500">{message}</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary disabled:opacity-60"
          onClick={detectLocation}
          disabled={locating}
        >
          <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
          {locating ? "Finding…" : "Use location"}
        </button>
      </div>
      {distanceKm !== null && !outOfRange && deliverySlab ? (
        <p className="mt-2 pl-7 text-xs font-semibold text-primary">
          {distanceKm.toFixed(1)} km away · {subtotal > 0 ? deliveryFee === 0 ? "Free delivery" : `Delivery ${formatCurrency(deliveryFee)}` : `Delivery ${formatCurrency(deliverySlab.deliveryCharge)} (free from ${formatCurrency(deliverySlab.freeDeliveryThreshold)})`}
        </p>
      ) : null}
    </div>
  );
}

function MobileMenuRow({ item }: { item: MenuSectionProps["items"][number] }) {
  const { items, addItem, updateQuantity } = useCart();
  const quantity = items.find((entry) => entry.id === item.id)?.quantity ?? 0;
  const cartItem = getCartItem(item);

  return (
    <article className="py-3.5">
      <div className="flex min-w-0 gap-3">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={112}
          height={112}
          className="h-24 w-24 shrink-0 rounded-2xl border border-border bg-white object-cover"
          sizes="96px"
          quality={75}
          loading="lazy"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <FoodMarker item={item} />
                <h3 className="truncate text-base font-semibold leading-5 text-foreground">{item.name}</h3>
              </div>
              <p className="mt-1 truncate text-xs leading-5 text-stone-500">{item.description}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">{formatCurrency(item.price)}</span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <span className="max-w-[55%] truncate text-[11px] font-medium text-stone-500">{item.badge}</span>
            {quantity > 0 ? (
              <div className="inline-flex shrink-0 items-center rounded-lg border border-primary bg-white text-primary">
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  className="grid h-8 w-8 place-items-center"
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  aria-label={`Add one ${item.name}`}
                  className="grid h-8 w-8 place-items-center"
                  onClick={() => addItem(cartItem)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="h-8 shrink-0 rounded-lg border border-primary px-4 text-xs font-bold tracking-wide text-primary"
                onClick={() => addItem(cartItem)}
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
      {item.components.length ? (
        <details className="ml-[108px] mt-2 text-xs text-stone-600">
          <summary className="cursor-pointer font-semibold text-primary">Includes {item.components.length} items</summary>
          <p className="mt-1 leading-5">{item.components.map(({ itemName }) => itemName).join(" · ")}</p>
        </details>
      ) : null}
    </article>
  );
}

function MobileCartBar() {
  const { itemCount, subtotal } = useCart();
  if (!itemCount) return null;

  return (
    <Link
      href="/checkout"
      className="fixed inset-x-3 bottom-3 z-[7500] flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-white shadow-[0_14px_32px_rgba(181,30,30,0.28)] md:hidden"
      aria-label={`View cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
    >
      <span className="flex items-center gap-3">
        <span className="relative grid h-9 w-9 place-items-center rounded-full border border-white/60">
          <ShoppingBag className="h-4 w-4" />
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">{itemCount}</span>
        </span>
        <span>
          <span className="block text-sm font-semibold">{itemCount} item{itemCount === 1 ? "" : "s"} added</span>
          <span className="block text-xs text-white/80">{formatCurrency(subtotal)}</span>
        </span>
      </span>
      <span className="text-sm font-bold">View cart →</span>
    </Link>
  );
}

function MenuCard({ item }: { item: MenuSectionProps["items"][number] }) {
  const { items, addItem, replaceWithSingleItem, updateQuantity } = useCart();
  const quantity = items.find((entry) => entry.id === item.id)?.quantity ?? 0;
  const isCombo = item.badge.includes("Combo Offer");
  const cartItem = getCartItem(item);

  return (
    <div className="w-full min-w-0 max-w-full">
      <Card className={`w-full min-w-0 max-w-full overflow-hidden p-4 ${isCombo ? "border-[#d08b2f] bg-gradient-to-b from-[#fffaf0] to-white shadow-[0_18px_45px_rgba(184,59,47,0.12)]" : ""}`}>
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={640}
          height={640}
          className="aspect-square h-auto w-full rounded-[24px] border border-border bg-white object-cover"
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
          quality={82}
          loading="lazy"
        />
        <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Badge>{item.badge}</Badge>
            <div className="mt-3 flex items-center gap-2">
              <FoodMarker item={item} />
              <h3 className="break-words font-serif text-2xl">{item.name}</h3>
            </div>
          </div>
          <p className="break-words text-lg font-semibold text-primary sm:shrink-0">{formatCurrency(item.price)}</p>
        </div>
        <p className="mt-3 break-words text-sm leading-7 text-stone-600">{item.description}</p>
        {isCombo ? <p className="mt-2 text-sm font-semibold text-primary">Limited Sunday preparation—reserve yours early.</p> : null}
        <ul className="mt-4 grid gap-2 text-sm text-stone-700">
          {item.components.map((component) => (
            <li key={component.itemName} className="max-w-full break-words rounded-2xl bg-muted px-3 py-2">
              {component.itemName}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-2 rounded-full border border-border bg-white p-1 sm:w-auto">
            <button
              type="button"
              className="rounded-full px-3 py-2"
              onClick={(event) => {
                event.stopPropagation();
                if (quantity > 0) updateQuantity(item.id, quantity - 1);
              }}
              disabled={quantity === 0}
            >
              -
            </button>
            <span className="min-w-8 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              className="rounded-full px-3 py-2"
              onClick={(event) => {
                event.stopPropagation();
                if (quantity === 0) {
                  addItem(cartItem, 1);
                  return;
                }

                updateQuantity(item.id, quantity + 1);
              }}
            >
              +
            </button>
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-1 sm:justify-end">
            <Button
              size="sm"
              className="w-full transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:min-w-[118px]"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                addItem(cartItem, 1);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              size="sm"
              className="w-full transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:min-w-[108px]"
              onClick={(event) => {
                event.stopPropagation();
                replaceWithSingleItem(cartItem, Math.max(quantity, 1));
                window.location.href = "/checkout";
              }}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
