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
