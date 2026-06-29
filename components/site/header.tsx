import Link from "next/link";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            SK
          </div>
          <div>
            <p className="font-serif text-xl leading-none">Saswati’s Kitchen</p>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Barrackpore homemade meals
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link href="#menu">Today’s Menu</Link>
          <Link href="#delivery">Delivery Rules</Link>
          <Link href="#timing">Slot Timing</Link>
          <Link href="#support">Support</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="#menu" className={cn(buttonVariants({ variant: "secondary" }), "hidden sm:inline-flex")}>
            Order Today
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
