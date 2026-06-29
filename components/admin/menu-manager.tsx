"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, slugify } from "@/lib/utils";

type MenuRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  mealType: "LUNCH" | "DINNER";
  badge: string;
  isActive: boolean;
  stockLimit: number;
  components: Array<{ itemName: string }>;
};

export function MenuManager({ initialItems }: { initialItems: MenuRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "149",
    imageUrl: "/brand/chicken-thali.svg",
    mealType: "LUNCH",
    badge: "Today’s Pick",
    stockLimit: "20",
    components: "Rice, Moosor daal, Aloo potol kosha"
  });

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      mealType: form.mealType as "LUNCH" | "DINNER",
      badge: form.badge,
      isActive: true,
      stockLimit: Number(form.stockLimit),
      components: form.components.split(",").map((item) => item.trim()).filter(Boolean)
    };

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) return;

    setItems((current) => [result.item, ...current]);
    setForm({
      name: "",
      description: "",
      price: "149",
      imageUrl: "/brand/chicken-thali.svg",
      mealType: "LUNCH",
      badge: "Today’s Pick",
      stockLimit: "20",
      components: "Rice, Moosor daal, Aloo potol kosha"
    });
  }

  async function toggleActive(item: MenuRow) {
    const response = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        components: item.components.map((component) => component.itemName),
        isActive: !item.isActive
      })
    });
    const result = await response.json();
    if (!result.ok) return;

    setItems((current) => current.map((row) => (row.id === item.id ? result.item : row)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Add menu item</p>
        <form className="mt-5 space-y-4" onSubmit={submitForm}>
          <Input placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Price" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            <Input placeholder="Badge" value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Image URL" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
            <Input placeholder="Stock limit" type="number" value={form.stockLimit} onChange={(event) => setForm({ ...form, stockLimit: event.target.value })} />
          </div>
          <Textarea placeholder="Components comma-separated" value={form.components} onChange={(event) => setForm({ ...form, components: event.target.value })} />
          <Button className="w-full">Save menu item</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-2xl">{item.name}</h3>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{item.badge}</span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{item.description}</p>
                <p className="mt-3 text-sm">
                  {formatCurrency(item.price)} · {item.mealType} · Stock {item.stockLimit}
                </p>
              </div>
              <Button variant={item.isActive ? "outline" : "default"} onClick={() => toggleActive(item)}>
                {item.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
