"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SettingsShape = {
  kitchenLatitude: number;
  kitchenLongitude: number;
  lunchCloseTime: string;
  dinnerOpenTime: string;
  dinnerCloseTime: string;
  freeDeliveryOneKmMin: number;
  freeDeliveryTwoKmMin: number;
  aboveTwoKmDeliveryCharge: number;
  lowOrderDeliveryCharge: number;
  upiId: string;
  qrImageUrl: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: SettingsShape }) {
  const [form, setForm] = useState({
    ...initialSettings,
    kitchenLatitude: String(initialSettings.kitchenLatitude),
    kitchenLongitude: String(initialSettings.kitchenLongitude),
    freeDeliveryOneKmMin: String(initialSettings.freeDeliveryOneKmMin),
    freeDeliveryTwoKmMin: String(initialSettings.freeDeliveryTwoKmMin),
    aboveTwoKmDeliveryCharge: String(initialSettings.aboveTwoKmDeliveryCharge),
    lowOrderDeliveryCharge: String(initialSettings.lowOrderDeliveryCharge)
  });
  const [message, setMessage] = useState("");

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kitchenLatitude: Number(form.kitchenLatitude),
        kitchenLongitude: Number(form.kitchenLongitude),
        lunchCloseTime: form.lunchCloseTime,
        dinnerOpenTime: form.dinnerOpenTime,
        dinnerCloseTime: form.dinnerCloseTime,
        freeDeliveryOneKmMin: Number(form.freeDeliveryOneKmMin),
        freeDeliveryTwoKmMin: Number(form.freeDeliveryTwoKmMin),
        aboveTwoKmDeliveryCharge: Number(form.aboveTwoKmDeliveryCharge),
        lowOrderDeliveryCharge: Number(form.lowOrderDeliveryCharge),
        upiId: form.upiId,
        qrImageUrl: form.qrImageUrl
      })
    });
    const result = await response.json();
    setMessage(result.ok ? "Settings updated." : result.error);
  }

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Kitchen & delivery settings</p>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
        <Input placeholder="Kitchen latitude" value={form.kitchenLatitude} onChange={(event) => setForm({ ...form, kitchenLatitude: event.target.value })} />
        <Input placeholder="Kitchen longitude" value={form.kitchenLongitude} onChange={(event) => setForm({ ...form, kitchenLongitude: event.target.value })} />
        <Input placeholder="Lunch close time" value={form.lunchCloseTime} onChange={(event) => setForm({ ...form, lunchCloseTime: event.target.value })} />
        <Input placeholder="Dinner open time" value={form.dinnerOpenTime} onChange={(event) => setForm({ ...form, dinnerOpenTime: event.target.value })} />
        <Input placeholder="Dinner close time" value={form.dinnerCloseTime} onChange={(event) => setForm({ ...form, dinnerCloseTime: event.target.value })} />
        <Input placeholder="UPI ID" value={form.upiId} onChange={(event) => setForm({ ...form, upiId: event.target.value })} />
        <Input placeholder="Free delivery up to 1 km" value={form.freeDeliveryOneKmMin} onChange={(event) => setForm({ ...form, freeDeliveryOneKmMin: event.target.value })} />
        <Input placeholder="Free delivery above 1 km" value={form.freeDeliveryTwoKmMin} onChange={(event) => setForm({ ...form, freeDeliveryTwoKmMin: event.target.value })} />
        <Input placeholder="Charge above 2 km" value={form.aboveTwoKmDeliveryCharge} onChange={(event) => setForm({ ...form, aboveTwoKmDeliveryCharge: event.target.value })} />
        <Input placeholder="Low order delivery charge" value={form.lowOrderDeliveryCharge} onChange={(event) => setForm({ ...form, lowOrderDeliveryCharge: event.target.value })} />
        <Input className="md:col-span-2" placeholder="QR image URL" value={form.qrImageUrl} onChange={(event) => setForm({ ...form, qrImageUrl: event.target.value })} />
        <div className="md:col-span-2">
          <Button>Save settings</Button>
        </div>
        {message ? <p className="text-sm text-primary md:col-span-2">{message}</p> : null}
      </form>
    </Card>
  );
}
