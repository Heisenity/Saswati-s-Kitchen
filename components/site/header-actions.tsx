"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeaderUser = {
  email?: string | null;
  role?: "USER" | "ADMIN";
} | null;

const HEADER_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedHeaderUser = {
  email?: string | null;
  role?: "USER" | "ADMIN";
  expiresAt: number;
};

export function HeaderActions({ onSelectMenu }: { onSelectMenu: (type: "LUNCH" | "DINNER") => void }) {
  const [user, setUser] = useState<HeaderUser>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  function getCacheKey(email?: string | null) {
    return email ? `saswatis-kitchen:header-user:${email.toLowerCase()}` : "";
  }

  function readCachedUser(email?: string | null): HeaderUser {
    const cacheKey = getCacheKey(email);
    if (!cacheKey || typeof window === "undefined") return null;

    const cached = window.localStorage.getItem(cacheKey);
    if (!cached) return null;

    try {
      const parsed = JSON.parse(cached) as CachedHeaderUser;
      if (parsed.expiresAt < Date.now()) {
        window.localStorage.removeItem(cacheKey);
        return null;
      }
      return { email: parsed.email, role: parsed.role === "ADMIN" ? "ADMIN" : "USER" };
    } catch {
      window.localStorage.removeItem(cacheKey);
      return null;
    }
  }

  function writeCachedUser(nextUser: HeaderUser) {
    const cacheKey = getCacheKey(nextUser?.email);
    if (!cacheKey || typeof window === "undefined") return;

    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        email: nextUser?.email,
        role: nextUser?.role === "ADMIN" ? "ADMIN" : "USER",
        expiresAt: Date.now() + HEADER_CACHE_TTL_MS
      } satisfies CachedHeaderUser)
    );
  }

  async function loadUser(nextUser: { email?: string | null } | null) {
    if (!nextUser) {
      setUser(null);
      return;
    }

    const cached = readCachedUser(nextUser.email);
    if (cached) {
      setUser(cached);
      return;
    }

    const response = await fetch("/api/account/session", { cache: "no-store" });
    const result = await response.json().catch(() => null);
    const resolvedUser = { ...nextUser, role: result?.role === "ADMIN" ? "ADMIN" : "USER" } satisfies NonNullable<HeaderUser>;
    setUser(resolvedUser);
    writeCachedUser(resolvedUser);
  }

  useEffect(() => {
    let active = true;
    setMounted(true);
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      void loadUser(data.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      void loadUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const mobileMenu = menuOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[9000] lg:hidden">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
      <aside id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation" className="absolute inset-y-0 right-0 flex w-[86vw] max-w-xs flex-col overflow-y-auto border-l border-border bg-card/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-serif text-2xl">Menu</p>
          <button type="button" aria-label="Close menu" className="rounded-full border border-border p-2" onClick={() => setMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-7 grid gap-2 text-sm font-semibold">
          <button type="button" className="rounded-2xl px-4 py-3 text-left hover:bg-muted" onClick={() => { setMenuOpen(false); onSelectMenu("LUNCH"); }}>Today’s Lunch Menu</button>
          <button type="button" className="rounded-2xl px-4 py-3 text-left hover:bg-muted" onClick={() => { setMenuOpen(false); onSelectMenu("DINNER"); }}>Today’s Dinner Menu</button>
          <Link href="/#delivery" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Delivery Rules</Link>
          <Link href="/#timing" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Slot Timing</Link>
          <Link href="/#support" data-open-chat="true" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Support / Chat</Link>
          {user ? (
            <>
              <Link href="/account" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Account</Link>
              <Link href="/account" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Orders</Link>
              {user.role === "ADMIN" ? <Link href="/admin/dashboard" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link> : null}
            </>
          ) : (
            <Link href="/login" className="rounded-2xl px-4 py-3 hover:bg-muted" onClick={() => setMenuOpen(false)}>Login / Sign Up</Link>
          )}
        </nav>
        {user ? (
          <form action="/auth/signout" method="post" className="mt-auto pt-6">
            <button className="w-full rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold">Sign out</button>
          </form>
        ) : null}
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {user ? (
        <>
          <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
            Account
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
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileMenu}
    </div>
  );
}
