"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();

  return (
    <>
      <button
        className="relative inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm"
        onClick={() => setOpen(true)}
      >
        <ShoppingBag className="mr-2 h-4 w-4" />
        Cart
        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
          {itemCount}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl">Your Cart</h3>
              <button className="text-sm font-semibold" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-stone-600">
                  Your thali cart is empty.
                </div>
              ) : null}

              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-border bg-card p-3">
                  <div className="flex gap-3">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl border border-border bg-white object-cover"
                      sizes="80px"
                      quality={75}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-stone-600">{formatCurrency(item.price)}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                          <Trash2 className="h-4 w-4 text-stone-500" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          className="rounded-full border border-border p-2"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          className="rounded-full border border-border p-2"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <p className="mt-3 text-xs text-stone-600">
                Delivery charge and 50% advance will be calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants(), "mt-4 flex w-full")}
              >
                Proceed to Checkout
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
