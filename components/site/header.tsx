import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { buttonVariants } from "@/components/ui/button";
import { getSessionContext } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function Header() {
  const { user, profile } = await getSessionContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpg"
            alt="Saswati's Kitchen logo"
            width={56}
            height={56}
            className="h-12 w-12 rounded-2xl border border-border bg-white object-cover"
            sizes="48px"
            priority
          />
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
          {user ? (
            <>
              <Link
                href={profile?.role === "ADMIN" ? "/admin/dashboard" : "/account"}
                className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}
              >
                {profile?.role === "ADMIN" ? "Admin" : "Account"}
              </Link>
              <form action="/auth/signout" method="post" className="hidden sm:block">
                <button className={cn(buttonVariants({ variant: "ghost" }))}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}
            >
              Free Sign Up
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login?next=/account"}
            className={cn(buttonVariants({ variant: "secondary" }), "hidden sm:inline-flex")}
          >
            <Bell className="mr-2 h-4 w-4 origin-top animate-[bell-ring_10s_ease-in-out_infinite]" />
            Orders
          </Link>
          <CartDrawer />
        </div>
      </div>
      <a
        href="https://wa.me/message/4GUHVHNMAFS3L1"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform duration-200 hover:-translate-y-1"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
          <path d="M19.11 17.36c-.29-.14-1.69-.83-1.95-.92-.26-.09-.45-.14-.64.14-.19.28-.73.92-.89 1.11-.16.19-.32.21-.61.07-.29-.14-1.2-.44-2.28-1.41-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.12-.57.13-.13.29-.33.43-.5.14-.17.19-.28.29-.47.09-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.56-.46-.48-.64-.49h-.54c-.19 0-.5.07-.76.35-.26.28-1 1-.98 2.43.02 1.43 1.03 2.81 1.17 3 .14.19 2.02 3.09 4.89 4.33.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.69-.69 1.93-1.36.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.55-.33Z" />
          <path d="M27.26 4.73A15.84 15.84 0 0 0 16.01 0C7.17 0 0 7.17 0 16c0 2.82.74 5.58 2.14 8.02L0 32l8.19-2.1A15.94 15.94 0 0 0 16.01 32C24.83 32 32 24.83 32 16c0-4.27-1.66-8.28-4.74-11.27ZM16.01 29.3c-2.41 0-4.77-.65-6.83-1.88l-.49-.29-4.86 1.25 1.29-4.74-.32-.49A13.27 13.27 0 0 1 2.72 16c0-7.31 5.96-13.27 13.29-13.27 3.55 0 6.88 1.38 9.39 3.88A13.18 13.18 0 0 1 29.3 16c0 7.31-5.96 13.3-13.29 13.3Z" />
        </svg>
      </a>
    </header>
  );
}
