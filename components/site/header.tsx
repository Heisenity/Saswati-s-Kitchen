"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HeaderActions } from "@/components/site/header-actions";

export function Header() {
  function selectMenu(type: "LUNCH" | "DINNER", button: HTMLButtonElement) {
    window.dispatchEvent(new CustomEvent("menu-filter", { detail: type }));
    button.closest("details")?.removeAttribute("open");
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }

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
              Homemade meals
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5">
              Today’s Menu
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="absolute left-1/2 top-full mt-3 w-44 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-warm">
              <button type="button" className="w-full rounded-xl px-4 py-2.5 text-left hover:bg-muted" onClick={(event) => selectMenu("LUNCH", event.currentTarget)}>
                Lunch menu
              </button>
              <button type="button" className="w-full rounded-xl px-4 py-2.5 text-left hover:bg-muted" onClick={(event) => selectMenu("DINNER", event.currentTarget)}>
                Dinner menu
              </button>
            </div>
          </details>
          <Link href="#delivery">Delivery Rules</Link>
          <Link href="#timing">Slot Timing</Link>
          <a href="#support" data-open-chat="true">Support</a>
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}
