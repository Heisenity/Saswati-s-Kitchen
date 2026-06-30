"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeaderUser = {
  email?: string | null;
} | null;

export function HeaderActions() {
  const [user, setUser] = useState<HeaderUser>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
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
    </div>
  );
}
