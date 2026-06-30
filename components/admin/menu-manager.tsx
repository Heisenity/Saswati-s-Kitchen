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

function createEmptyForm() {
  return {
    name: "",
    description: "",
    price: "149",
    imageUrl: "/brand/chicken-thali.jpg",
    mealType: "LUNCH",
    badge: "Today’s Pick",
    stockLimit: "20",
    components: "Rice, Moosor daal, Aloo potol kosha"
  };
}

export function MenuManager({ initialItems }: { initialItems: MenuRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bulkComponent, setBulkComponent] = useState("");
  const [bulkAction, setBulkAction] = useState<"add_component" | "remove_component">("add_component");
  const [bulkSaving, setBulkSaving] = useState(false);

  function syncItems(updater: MenuRow[] | ((current: MenuRow[]) => MenuRow[])) {
    setItems((current) => {
      const nextItems = typeof updater === "function" ? updater(current) : updater;
      setSelectedIds((selected) => selected.filter((id) => nextItems.some((item) => item.id === id)));
      return nextItems;
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const currentItem = editingId ? items.find((item) => item.id === editingId) : null;

    const payload = {
      id: editingId ?? undefined,
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      mealType: form.mealType as "LUNCH" | "DINNER",
      badge: form.badge,
      isActive: currentItem?.isActive ?? true,
      stockLimit: Number(form.stockLimit),
      components: form.components.split(",").map((item) => item.trim()).filter(Boolean)
    };

    const response = await fetch("/api/admin/menu", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSaving(false);

    if (!result.ok) {
      setMessage(result.error ?? "Could not save menu item.");
      return;
    }

    syncItems((current) =>
      editingId
        ? current.map((row) => (row.id === result.item.id ? result.item : row))
        : [result.item, ...current]
    );
    setForm(createEmptyForm());
    setEditingId(null);
    setMessage(editingId ? "Menu item updated." : "Menu item added.");
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

    syncItems((current) => current.map((row) => (row.id === item.id ? result.item : row)));
  }

  function startEditing(item: MenuRow) {
    setEditingId(item.id);
    setMessage("");
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      imageUrl: item.imageUrl,
      mealType: item.mealType,
      badge: item.badge,
      stockLimit: String(item.stockLimit),
      components: item.components.map((component) => component.itemName).join(", ")
    });
  }

  function resetForm() {
    setEditingId(null);
    setMessage("");
    setForm(createEmptyForm());
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }

  async function submitBulkComponentUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIds.length || !bulkComponent.trim()) {
      setMessage("Select thalis and write the dish name first.");
      return;
    }

    setBulkSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemIds: selectedIds,
        action: bulkAction,
        component: bulkComponent.trim()
      })
    });
    const result = await response.json();
    setBulkSaving(false);

    if (!result.ok) {
      setMessage(result.error ?? "Could not update the selected thalis.");
      return;
    }

    syncItems(result.items);
    setBulkComponent("");
    setMessage(
      bulkAction === "add_component"
        ? "Dish added to the selected thalis."
        : "Dish removed from the selected thalis."
    );
  }

  async function uploadImage(file: File) {
    setUploadingImage(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/menu-image", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    setUploadingImage(false);

    if (!result.ok) {
      setMessage(result.error ?? "Image upload failed.");
      return;
    }

    setForm((current) => ({ ...current, imageUrl: result.url }));
    setMessage("Image uploaded. Save the menu item to keep it.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          {editingId ? "Edit menu item" : "Add menu item"}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Every existing thali can be edited here, including price, badge, stock, and image.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submitForm}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Item name</label>
            <Input placeholder="Mutton Thali" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Description</label>
            <Textarea placeholder="Short homestyle description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Price (INR)</label>
              <Input placeholder="149" type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Badge</label>
              <Input placeholder="Most Loved" value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Meal type</label>
              <select
                className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/50"
                value={form.mealType}
                onChange={(event) => setForm({ ...form, mealType: event.target.value as "LUNCH" | "DINNER" })}
              >
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Stock limit</label>
              <Input placeholder="20" type="number" min="0" value={form.stockLimit} onChange={(event) => setForm({ ...form, stockLimit: event.target.value })} />
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-border bg-muted/40 p-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Image URL</label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Upload a new thali image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                  event.currentTarget.value = "";
                }}
              />
              <p className="text-xs text-stone-500">Upload once, then save the menu item to apply the new picture everywhere.</p>
            </div>
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt={form.name || "Menu preview"}
                className="h-36 w-full rounded-2xl object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Included items</label>
            <Textarea placeholder="Rice, Moosor daal, Aloo potol kosha" value={form.components} onChange={(event) => setForm({ ...form, components: event.target.value })} />
            <p className="text-xs text-stone-500">Write the thali items separated by commas.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full" disabled={saving || uploadingImage}>
              {saving ? "Saving..." : editingId ? "Update menu item" : "Save menu item"}
            </Button>
            {editingId ? (
              <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          {message ? <p className="text-sm text-primary">{message}</p> : null}
        </form>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Bulk dish update
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Tick multiple thalis, then add or remove one shared dish in a single save.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-stone-600">
              {selectedIds.length} selected
            </span>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={submitBulkComponentUpdate}>
            <select
              className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/50"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value as "add_component" | "remove_component")}
            >
              <option value="add_component">Add dish</option>
              <option value="remove_component">Remove dish</option>
            </select>
            <Input
              placeholder="Example: Beguni"
              value={bulkComponent}
              onChange={(event) => setBulkComponent(event.target.value)}
            />
            <Button className="w-full md:w-auto" disabled={bulkSaving || !selectedIds.length}>
              {bulkSaving ? "Saving..." : "Apply"}
            </Button>
          </form>
        </Card>

        {items.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <label className="mt-1 flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                </label>
                <img src={item.imageUrl} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-2xl">{item.name}</h3>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{item.badge}</span>
                  </div>
                  <p className="text-sm text-stone-600">{item.description}</p>
                  <p className="mt-3 text-sm">
                    {formatCurrency(item.price)} · {item.mealType} · Stock {item.stockLimit}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    {item.components.map((component) => component.itemName).join(" • ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => startEditing(item)}>
                  Edit
                </Button>
                <Button size="sm" variant={item.isActive ? "outline" : "default"} onClick={() => toggleActive(item)}>
                  {item.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
