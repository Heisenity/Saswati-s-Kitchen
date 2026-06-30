"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

const CustomerAuthCard = dynamic(
  () => import("@/components/auth/customer-auth-card").then((mod) => mod.CustomerAuthCard)
);

type MenuSectionProps = {
  items: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    badge: string;
    imageUrl: string;
    components: Array<{ itemName: string }>;
  }>;
};

export function MenuSection({ items }: MenuSectionProps) {
  const [authNext, setAuthNext] = useState("/");
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section id="menu" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">
              Today’s Lunch Menu
            </p>
            <h2 className="mt-3 font-serif text-4xl">Lunch thalis made for daily comfort</h2>
          </div>
          <p className="max-w-lg text-sm leading-7 text-stone-600">
            Cooked fresh daily. Limited preparation for freshness, so once a thali is sold out we stop taking more orders.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <MenuCard
              item={item}
              key={item.id}
              onAuthRequired={(next) => {
                setAuthNext(next);
                setAuthOpen(true);
              }}
            />
          ))}
        </div>
      </div>
      {authOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-foreground shadow"
            >
              <X className="h-4 w-4" />
            </button>
            <CustomerAuthCard next={authNext} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MenuCard({
  item,
  onAuthRequired
}: {
  item: MenuSectionProps["items"][number];
  onAuthRequired: (next: string) => void;
}) {
  const { addItem, replaceWithSingleItem } = useCart();
  const [quantity, setQuantity] = useState(0);

  async function requireAuth(next: string) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) return true;
    onAuthRequired(next);
    return false;
  }

  return (
    <div>
      <Card className="overflow-hidden p-4">
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
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <Badge>{item.badge}</Badge>
            <h3 className="mt-3 font-serif text-2xl">{item.name}</h3>
          </div>
          <p className="text-lg font-semibold text-primary">{formatCurrency(item.price)}</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
        <ul className="mt-4 grid gap-2 text-sm text-stone-700">
          {item.components.map((component) => (
            <li key={component.itemName} className="rounded-2xl bg-muted px-3 py-2">
              {component.itemName}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-white p-1">
            <button
              type="button"
              className="rounded-full px-3 py-2"
              onClick={(event) => {
                event.stopPropagation();
                setQuantity(Math.max(0, quantity - 1));
              }}
            >
              -
            </button>
            <span className="min-w-8 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              className="rounded-full px-3 py-2"
              onClick={(event) => {
                event.stopPropagation();
                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div>
          <div className="flex flex-1 justify-end gap-2">
            <Button
              size="sm"
              className="min-w-[118px] transition-transform duration-200 hover:-translate-y-0.5"
              variant="outline"
              disabled={quantity === 0}
              onClick={async (event) => {
                event.stopPropagation();
                addItem(
                  {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    badge: item.badge
                  },
                  quantity
                );
                if (!(await requireAuth("/"))) return;
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              size="sm"
              className="min-w-[108px] transition-transform duration-200 hover:-translate-y-0.5"
              disabled={quantity === 0}
              onClick={async (event) => {
                event.stopPropagation();
                replaceWithSingleItem(
                  {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    badge: item.badge
                  },
                  quantity
                );
                if (!(await requireAuth("/checkout"))) return;
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
