"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="relative inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <ShoppingBag className="mr-2 h-4 w-4" />
        Cart
        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
          {itemCount}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-0 bottom-[7rem] z-[100] sm:bottom-[8.5rem]">
          <button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            className="fixed right-0 top-0 bottom-[7rem] z-[101] flex w-full max-w-[420px] flex-col overflow-hidden rounded-bl-[32px] border-l border-b border-[#eadfd3] bg-[#fffaf5] shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:bottom-[8.5rem]"
          >
            <header className="flex items-center justify-between border-b border-[#eadfd3] px-6 py-5">
              <h3 className="font-serif text-2xl">Your Cart</h3>
              <button
                type="button"
                className="text-sm font-semibold"
                onClick={() => setOpen(false)}
                aria-label="Close cart drawer"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {hasItems ? (
                <div className="space-y-4">
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
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-stone-500" />
                            </button>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-border p-2"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              type="button"
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
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="w-full rounded-[24px] border border-dashed border-[#eadfd3] bg-white/70 p-6 text-center">
                    <p className="font-semibold text-stone-900">Your thali cart is empty.</p>
                    <p className="mt-2 text-sm text-stone-600">Add your favourite meal to continue.</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-[#eadfd3] bg-white/90 px-6 py-5 backdrop-blur">
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
                className={cn(buttonVariants(), "mt-4 flex w-full", !hasItems && "pointer-events-none opacity-50")}
                aria-disabled={!hasItems}
              >
                Proceed to Checkout
              </Link>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
