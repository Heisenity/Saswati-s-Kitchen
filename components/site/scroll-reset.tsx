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

  return null;
}
