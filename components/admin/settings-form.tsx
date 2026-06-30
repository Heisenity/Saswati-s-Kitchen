"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { defaultKitchenAddress } from "@/lib/default-data";

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

function Field({
  label,
  hint,
  children,
  className = ""
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <p className="mt-1 text-xs leading-5 text-stone-500">{hint}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

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
      <p className="mt-3 text-sm text-stone-600">
        Delivery origin address: {defaultKitchenAddress}
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        Each field below controls either the delivery origin, slot timing, free-delivery thresholds, or the payment setup shown to customers.
      </p>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
        <Field label="Kitchen latitude" hint="Used as the fixed starting point for every delivery distance check.">
          <Input type="number" step="0.000001" value={form.kitchenLatitude} onChange={(event) => setForm({ ...form, kitchenLatitude: event.target.value })} />
        </Field>
        <Field label="Kitchen longitude" hint="Keep this matched with the Barrackpore kitchen location.">
          <Input type="number" step="0.000001" value={form.kitchenLongitude} onChange={(event) => setForm({ ...form, kitchenLongitude: event.target.value })} />
        </Field>
        <Field label="Lunch close time" hint="After this IST time, same-day lunch checkout closes automatically.">
          <Input type="time" value={form.lunchCloseTime} onChange={(event) => setForm({ ...form, lunchCloseTime: event.target.value })} />
        </Field>
        <Field label="Dinner open time" hint="Dinner ordering starts from this IST time.">
          <Input type="time" value={form.dinnerOpenTime} onChange={(event) => setForm({ ...form, dinnerOpenTime: event.target.value })} />
        </Field>
        <Field label="Dinner close time" hint="Dinner ordering stops after this IST time.">
          <Input type="time" value={form.dinnerCloseTime} onChange={(event) => setForm({ ...form, dinnerCloseTime: event.target.value })} />
        </Field>
        <Field label="UPI ID" hint="Shown during checkout along with the payment QR code.">
          <Input value={form.upiId} onChange={(event) => setForm({ ...form, upiId: event.target.value })} />
        </Field>
        <Field label="Free delivery minimum up to 1 km" hint="Customers within 1 km unlock free delivery from this cart value.">
          <Input type="number" min="0" value={form.freeDeliveryOneKmMin} onChange={(event) => setForm({ ...form, freeDeliveryOneKmMin: event.target.value })} />
        </Field>
        <Field label="Free delivery minimum above 1 km" hint="Customers above 1 km and up to 2 km unlock free delivery from this value.">
          <Input type="number" min="0" value={form.freeDeliveryTwoKmMin} onChange={(event) => setForm({ ...form, freeDeliveryTwoKmMin: event.target.value })} />
        </Field>
        <Field label="Delivery charge above 2 km" hint="Applied when an order does not qualify for free delivery in the extended zone.">
          <Input type="number" min="0" value={form.aboveTwoKmDeliveryCharge} onChange={(event) => setForm({ ...form, aboveTwoKmDeliveryCharge: event.target.value })} />
        </Field>
        <Field label="Base low-order delivery charge" hint="Used for nearby low-value orders that do not unlock free delivery.">
          <Input type="number" min="0" value={form.lowOrderDeliveryCharge} onChange={(event) => setForm({ ...form, lowOrderDeliveryCharge: event.target.value })} />
        </Field>
        <Field
          className="md:col-span-2"
          label="QR image URL"
          hint="This image is shown on checkout for manual UPI payment scanning."
        >
          <Input value={form.qrImageUrl} onChange={(event) => setForm({ ...form, qrImageUrl: event.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <Button>Save settings</Button>
        </div>
        {message ? <p className="text-sm text-primary md:col-span-2">{message}</p> : null}
      </form>
    </Card>
  );
}
