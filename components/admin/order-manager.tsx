"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  slotType: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  advanceAmount: number;
  paymentUtr: string | null;
  paymentScreenshotUrl: string | null;
  createdAt: string | Date;
  items: Array<{ id: string; itemName: string; quantity: number }>;
};

const statuses = [
  "PAYMENT_PENDING_VERIFICATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED"
] as const;

export function OrderManager({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("ALL");

  async function updateStatus(id: string, orderStatus: string) {
    const response = await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus })
    });
    const result = await response.json();
    if (!result.ok) return;

    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, orderStatus: result.order.orderStatus, paymentStatus: result.order.paymentStatus } : order
      )
    );
  }

  const visibleOrders =
    filter === "ALL" ? orders : orders.filter((order) => order.orderStatus === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {["ALL", ...statuses].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.replaceAll("_", " ")}
          </Button>
        ))}
      </div>
      {visibleOrders.map((order) => (
        <Card key={order.id} className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{order.orderNumber}</p>
              <h3 className="mt-2 font-serif text-2xl">{order.customerName}</h3>
              <p className="mt-2 text-sm text-stone-600">
                {order.phone} · {order.slotType} · {formatDateTime(order.createdAt)}
              </p>
              <p className="mt-3 text-sm text-stone-700">{order.address}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {order.items.map((item) => (
                  <span key={item.id} className="rounded-full bg-muted px-3 py-2">
                    {item.itemName} x{item.quantity}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">
                Total {formatCurrency(order.totalAmount)} | Advance {formatCurrency(order.advanceAmount)}
              </p>
              {order.paymentScreenshotUrl ? (
                <a href={order.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary">
                  View payment proof
                </a>
              ) : null}
            </div>
            <div className="w-full max-w-xs rounded-3xl border border-border bg-white p-4">
              <p className="text-sm font-semibold">Update status</p>
              <select
                className="mt-3 h-11 w-full rounded-2xl border border-border px-3 text-sm"
                value={order.orderStatus}
                onChange={(event) => updateStatus(order.id, event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs text-stone-500">
                Payment status: {order.paymentStatus.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-xs text-stone-500">UTR: {order.paymentUtr ?? "Not provided"}</p>
            </div>
          </div>
        </Card>
      ))}
      {visibleOrders.length === 0 ? <Card className="p-6 text-sm text-stone-500">No orders found for this filter.</Card> : null}
    </div>
  );
}
