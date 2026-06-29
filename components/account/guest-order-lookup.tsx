"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { normalizePhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type LookupOrder = {
  orderNumber: string;
  phone: string;
  customerName: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

export function GuestOrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);

  async function lookupOrder() {
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: normalizePhone(phone)
        })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error);
      setOrder(result.order);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Could not find the order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Guest order lookup</p>
      <h2 className="mt-3 font-serif text-3xl">Find an order without signing in</h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        Enter your order ID and phone number to open your latest order details anytime.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Input placeholder="Order ID, e.g. SK-12345678" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
        <Input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "secondary" }), "mt-4 w-full sm:w-auto")}
        onClick={lookupOrder}
        disabled={loading || orderNumber.trim().length < 4 || phone.trim().length < 10}
      >
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Get order details
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {error}
        </p>
      ) : null}
      {order ? (
        <div className="mt-5 rounded-3xl border border-border bg-muted p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Order ID" value={order.orderNumber} />
            <Info label="Customer" value={order.customerName} />
            <Info label="Payment" value={order.paymentStatus.replaceAll("_", " ")} />
            <Info label="Status" value={order.orderStatus.replaceAll("_", " ")} />
            <Info label="Advance paid" value={formatCurrency(order.advanceAmount)} />
            <Info label="Balance due" value={formatCurrency(order.balanceAmount)} />
          </div>
          <Link href={`/receipt/${order.orderNumber}`} className={cn(buttonVariants(), "mt-4")}>
            Open receipt
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
