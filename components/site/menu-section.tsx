"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
            <MenuCard item={item} index={index} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuCard({
  item,
  index
}: {
  item: MenuSectionProps["items"][number];
  index: number;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Card className="overflow-hidden p-4">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={640}
          height={480}
          className="h-52 w-full rounded-[24px] border border-border bg-white object-cover"
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
            <button className="rounded-full px-3 py-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              -
            </button>
            <span className="min-w-8 text-center font-semibold">{quantity}</span>
            <button className="rounded-full px-3 py-2" onClick={() => setQuantity(quantity + 1)}>
              +
            </button>
          </div>
          <div className="flex flex-1 justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                addItem(
                  {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    badge: item.badge
                  },
                  quantity
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              onClick={() => {
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
                window.location.href = "/checkout";
              }}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
