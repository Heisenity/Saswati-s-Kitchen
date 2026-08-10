"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const reportOverflow = () => {
      const viewportWidth = document.documentElement.clientWidth;
      document.querySelectorAll<HTMLElement>("body *").forEach((element) => {
        if (element.getBoundingClientRect().width > viewportWidth + 1) {
          console.warn("[mobile-overflow]", element);
        }
      });
    };

    const timeout = window.setTimeout(reportOverflow, 500);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let lastRippleAt = 0;
    const showRipple = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastRippleAt < 70) return;
      lastRippleAt = now;

      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);

      const fallback = window.setTimeout(() => ripple.remove(), 900);
      ripple.addEventListener("animationend", () => {
        window.clearTimeout(fallback);
        ripple.remove();
      }, { once: true });
    };

    window.addEventListener("pointermove", showRipple, { passive: true });
    return () => window.removeEventListener("pointermove", showRipple);
  }, []);

  return null;
}
