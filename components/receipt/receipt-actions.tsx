"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReceiptActions({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Button type="button" onClick={() => window.print()}>
        Download receipt
      </Button>
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Send order summary on WhatsApp
      </Link>
      <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
        Back to home
      </Link>
    </div>
  );
}

export function ReceiptDateTime({
  value,
  mode = "full"
}: {
  value: string;
  mode?: "full" | "date" | "time";
}) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    ...(mode === "date"
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : mode === "time"
        ? { hour: "numeric", minute: "2-digit", hour12: true }
        : { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
  };

  return <time dateTime={value}>{new Intl.DateTimeFormat("en-IN", options).format(new Date(value))}</time>;
}
