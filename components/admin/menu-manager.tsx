"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Utensils,
  X
} from "lucide-react";
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
  itemKind: "THALI" | "ADD_ON";
  badge: string;
  isActive: boolean;
  stockLimit: number;
  components: Array<{ itemName: string }>;
};

type MenuForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  mealType: MenuRow["mealType"];
  itemKind: MenuRow["itemKind"];
  badge: string;
  stockLimit: string;
  components: string;
};

function createEmptyForm(
  mealType: MenuRow["mealType"] = "LUNCH",
  itemKind: MenuRow["itemKind"] = "THALI"
): MenuForm {
  return {
    name: "",
    description: "",
    price: itemKind === "THALI" ? "149" : "55",
    imageUrl:
      itemKind === "THALI"
        ? "/brand/chicken-thali.jpg"
        : "/brand/addons/chicken-curry.jpg",
    mealType,
    itemKind,
    badge: itemKind === "THALI" ? "Today’s Pick" : "1 plate",
    stockLimit: "20",
    components:
      itemKind === "THALI" ? "Rice, Moosor daal, Aloo potol kosha" : "1 plate"
  };
}

export function MenuManager({ initialItems }: { initialItems: MenuRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bulkComponent, setBulkComponent] = useState("");
  const [bulkAction, setBulkAction] = useState<"add_component" | "remove_component">("add_component");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [viewMealType, setViewMealType] = useState<"LUNCH" | "DINNER">("LUNCH");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "THALI" | "ADD_ON">("ALL");

  const visibleItems = items.filter((item) => item.mealType === viewMealType);
  const thaliItems = visibleItems.filter((item) => item.itemKind === "THALI");
  const addOnItems = visibleItems.filter((item) => item.itemKind === "ADD_ON");

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") resetForm();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen]);

  async function readApiResult(response: Response, fallbackError: string) {
    const text = await response.text();

    try {
      return JSON.parse(text) as {
        ok?: boolean;
        error?: string;
        uploadUrl?: string;
        url?: string;
        item?: MenuRow;
        items?: MenuRow[];
        issues?: Array<{ path?: string; message?: string }>;
      };
    } catch {
      return { ok: false, error: response.ok ? fallbackError : "Server request failed. Please try again." };
    }
  }

  function syncItems(updater: MenuRow[] | ((current: MenuRow[]) => MenuRow[])) {
    setItems((current) => {
      const nextItems = typeof updater === "function" ? updater(current) : updater;
      setSelectedIds((selected) => selected.filter((id) => nextItems.some((item) => item.id === id)));
      return nextItems;
    });
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
      itemKind: item.itemKind,
      badge: item.badge,
      stockLimit: String(item.stockLimit),
      components: item.components.map((component) => component.itemName).join(", ")
    });
    setIsModalOpen(true);
  }

  function openAddModal(itemKind: MenuRow["itemKind"] = "THALI") {
    setEditingId(null);
    setMessage("");
    setForm(createEmptyForm(viewMealType, itemKind));
    setIsModalOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setMessage("");
    setForm(createEmptyForm(viewMealType));
    setIsModalOpen(false);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const currentItem = editingId ? items.find((item) => item.id === editingId) : null;
    const price = Number(form.price);
    const stockLimit = Number(form.stockLimit);
    const components = form.components.split(",").map((item) => item.trim()).filter(Boolean);

    if (!/^\d+$/.test(form.price) || !Number.isInteger(price) || price < 1) {
      setMessage("Price must be a number only, for example 149. Do not use ₹ symbol.");
      return;
    }
    if (!/^\d+$/.test(form.stockLimit) || !Number.isInteger(stockLimit) || stockLimit < 0) {
      setMessage("Stock must be a whole number, for example 20.");
      return;
    }
    if (form.description.trim().length < 8) {
      setMessage("Description must be at least 8 characters.");
      return;
    }
    if (!form.imageUrl.trim()) {
      setMessage("Add an image URL or upload a menu image.");
      return;
    }
    if (form.badge.trim().length < 2) {
      setMessage("Badge must be at least 2 characters.");
      return;
    }
    if (!components.length) {
      setMessage("Add at least one included item, separated by commas.");
      return;
    }

    setSaving(true);

    const payload = {
      id: editingId ?? undefined,
      name: form.name,
      slug: currentItem?.slug ?? `${form.mealType.toLowerCase()}-${slugify(form.name)}-${crypto.randomUUID().slice(0, 8)}`,
      description: form.description.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      mealType: form.mealType as "LUNCH" | "DINNER",
      itemKind: form.itemKind as "THALI" | "ADD_ON",
      badge: form.badge.trim(),
      isActive: currentItem?.isActive ?? true,
      stockLimit: Number(form.stockLimit),
      components
    };

    const response = await fetch("/api/admin/menu", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await readApiResult(response, "Could not save menu item. Please try again.");
    setSaving(false);

    if (!result.ok) {
      const issues = Array.isArray(result.issues)
        ? result.issues.map((issue: { path?: string; message?: string }) =>
            `${issue.path || "field"}: ${issue.message || "Invalid value"}`
          ).join(" · ")
        : "";
      setMessage(issues || result.error || "Could not save menu item.");
      return;
    }
    if (!result.item) {
      setMessage("Could not save menu item. Please try again.");
      return;
    }
    const savedItem = result.item;

    syncItems((current) =>
      editingId
        ? current.map((row) => (row.id === savedItem.id ? savedItem : row))
        : [savedItem, ...current]
    );

    const itemName = form.name;
    const wasEditing = Boolean(editingId);
    resetForm();
    setBannerMessage(wasEditing ? `Updated "${itemName}" successfully.` : `Added "${itemName}" to menu.`);
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
    const result = await readApiResult(response, "Could not update menu item.");
    if (!result.ok) return;
    if (!result.item) return;

    const updatedItem = result.item;
    syncItems((current) => current.map((row) => (row.id === item.id ? updatedItem : row)));
    setBannerMessage(`"${item.name}" is now ${updatedItem.isActive ? "active" : "deactivated"}.`);
  }

  function changeMealType(next: "LUNCH" | "DINNER") {
    setViewMealType(next);
    setSelectedIds([]);
  }

  async function deleteItem(item: MenuRow) {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;

    const response = await fetch(`/api/admin/menu?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE"
    });
    const result = await readApiResult(response, "Could not delete menu item.");
    if (!result.ok) {
      setBannerMessage(result.error ?? "Could not delete menu item.");
      return;
    }

    syncItems((current) => current.filter((row) => row.id !== item.id));
    if (editingId === item.id) resetForm();
    setBannerMessage(`Deleted "${item.name}".`);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }

  async function submitBulkComponentUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIds.length || !bulkComponent.trim()) {
      setBannerMessage("Select thalis first, then enter the dish name.");
      return;
    }

    setBulkSaving(true);
    setBannerMessage("");
    const response = await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemIds: selectedIds,
        action: bulkAction,
        component: bulkComponent.trim()
      })
    });
    const result = await readApiResult(response, "Could not update the selected thalis.");
    setBulkSaving(false);

    if (!result.ok) {
      setBannerMessage(result.error ?? "Could not update the selected thalis.");
      return;
    }
    if (!result.items) {
      setBannerMessage("Could not update the selected thalis.");
      return;
    }

    syncItems(result.items);
    setBulkComponent("");
    setBannerMessage(
      bulkAction === "add_component"
        ? `Added "${bulkComponent.trim()}" to ${selectedIds.length} thalis.`
        : `Removed "${bulkComponent.trim()}" from ${selectedIds.length} thalis.`
    );
  }

  async function uploadImage(file: File) {
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setMessage("Please use an image smaller than 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please use a JPG, PNG, or WebP image.");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    try {
      const response = await fetch("/api/uploads/menu-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size })
      });
      const result = await readApiResult(response, "Image upload failed.");
      if (!result.ok || !result.uploadUrl || !result.url) {
        setMessage(result.error ?? "Image upload failed.");
        return;
      }

      const r2Response = await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!r2Response.ok) throw new Error("Image upload failed.");

      setForm((current) => ({ ...current, imageUrl: result.url as string }));
      setMessage("Image uploaded. Remember to click Save.");
    } catch (error) {
      console.error("[menu-image:browser-upload-failed]", error);
      setMessage(
        error instanceof TypeError
          ? "Could not connect to secure image storage. Refresh and try again."
          : "Image upload failed. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  const renderItemCard = (item: MenuRow, isThali: boolean) => (
    <Card
      key={item.id}
      className={`min-w-0 p-4 transition-all hover:shadow-md sm:p-5 ${
        !item.isActive ? "opacity-60 bg-stone-50/70" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          {isThali ? (
            <label className="mt-1 flex shrink-0 items-center cursor-pointer" title="Select for bulk update">
              <input
                type="checkbox"
                aria-label={`Select ${item.name} for bulk component update`}
                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleSelected(item.id)}
              />
            </label>
          ) : null}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm sm:h-24 sm:w-24"
          />
          <div className="min-w-0 break-words">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-900">{item.name}</h3>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                {item.badge}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  item.itemKind === "THALI"
                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                }`}
              >
                {item.itemKind === "THALI" ? "Thali" : "Add-on"}
              </span>
              {!item.isActive ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  Inactive
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-stone-600 line-clamp-2">{item.description}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-700">
              <span className="font-bold text-primary text-base">{formatCurrency(item.price)}</span>
              <span>·</span>
              <span>{item.mealType}</span>
              <span>·</span>
              <span className="text-stone-500">Stock: {item.stockLimit}</span>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-600">Includes:</span>{" "}
              {item.components.map((component) => component.itemName).join(" • ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-end lg:self-start">
          <Button
            size="sm"
            variant="default"
            className="bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5 shadow-sm"
            onClick={() => startEditing(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={item.isActive ? "text-stone-700 hover:bg-stone-100" : "bg-emerald-50 text-emerald-700 border-emerald-300"}
            onClick={() => void toggleActive(item)}
          >
            {item.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
            onClick={() => void deleteItem(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Notification */}
      {bannerMessage ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage("")}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Control Bar: Meal Type, Category Filter, and Add Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Meal Type Switcher */}
          <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
            {(["LUNCH", "DINNER"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={viewMealType === type}
                onClick={() => changeMealType(type)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  viewMealType === type ? "bg-primary text-white shadow-sm" : "text-stone-600 hover:bg-muted"
                }`}
              >
                {type === "LUNCH" ? "Lunch menu" : "Dinner menu"}
              </button>
            ))}
          </div>

          {/* Category Tabs: Do not mix Add-on and Thalis */}
          <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-sm">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className={`rounded-full px-4 py-2 font-medium transition ${
                categoryFilter === "ALL"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-muted"
              }`}
            >
              All items ({visibleItems.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("THALI")}
              className={`rounded-full px-4 py-2 font-medium transition ${
                categoryFilter === "THALI"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-600 hover:bg-muted"
              }`}
            >
              🍱 Thalis ({thaliItems.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("ADD_ON")}
              className={`rounded-full px-4 py-2 font-medium transition ${
                categoryFilter === "ADD_ON"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-stone-600 hover:bg-muted"
              }`}
            >
              🍛 Add-ons & Dishes ({addOnItems.length})
            </button>
          </div>
        </div>

        {/* Action Buttons to Add Item (Opens Modal) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => openAddModal("THALI")}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Thali</span>
          </Button>
          <Button
            onClick={() => openAddModal("ADD_ON")}
            variant="outline"
            className="flex items-center gap-1.5 rounded-2xl border-emerald-600 text-emerald-800 hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Dish / Add-on</span>
          </Button>
        </div>
      </div>

      {/* Bulk Dish Update for Thalis */}
      {(categoryFilter === "ALL" || categoryFilter === "THALI") && thaliItems.length > 0 ? (
        <Card className="p-4 sm:p-5 border-amber-200/80 bg-amber-50/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900">
                Bulk Thali Dish Update
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Tick thalis below, then add or remove a shared component (e.g., Beguni, Papad) in one save.
              </p>
            </div>
            <span className="rounded-full bg-white border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 w-fit">
              {selectedIds.length} thalis selected
            </span>
          </div>
          <form className="mt-3.5 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={submitBulkComponentUpdate}>
            <select
              className="flex h-11 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/50"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value as "add_component" | "remove_component")}
            >
              <option value="add_component">Add component</option>
              <option value="remove_component">Remove component</option>
            </select>
            <Input
              placeholder="e.g. Beguni, Sorshe Ilish, Chutney"
              value={bulkComponent}
              onChange={(event) => setBulkComponent(event.target.value)}
              className="h-11"
            />
            <Button className="h-11 w-full md:w-auto" disabled={bulkSaving || !selectedIds.length}>
              {bulkSaving ? "Updating..." : "Apply to selected"}
            </Button>
          </form>
        </Card>
      ) : null}

      {/* Separated Items Display */}
      <div className="space-y-8">
        {/* Section 1: Thalis */}
        {(categoryFilter === "ALL" || categoryFilter === "THALI") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-base">
                  🍱
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Thalis ({thaliItems.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Complete homestyle Bengali meals with rice, dal, and accompaniments.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAddModal("THALI")}
                className="text-xs gap-1 h-8 rounded-full"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Thali</span>
              </Button>
            </div>

            {thaliItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-stone-500">
                No thalis found for this meal slot. Click &quot;Add Thali&quot; above to add one.
              </div>
            ) : (
              <div className="grid gap-3">
                {thaliItems.map((item) => renderItemCard(item, true))}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Custom Dishes & Add-ons */}
        {(categoryFilter === "ALL" || categoryFilter === "ADD_ON") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-base">
                  🍛
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Custom Dishes & Add-ons ({addOnItems.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Individual fish/chicken/mutton curries, vegetables, dal, fried rice, rotis and sides.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAddModal("ADD_ON")}
                className="text-xs gap-1 h-8 rounded-full"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Dish</span>
              </Button>
            </div>

            {addOnItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-stone-500">
                No add-ons found for this meal slot. Click &quot;Add Custom Dish / Add-on&quot; above to add one.
              </div>
            ) : (
              <div className="grid gap-3">
                {addOnItems.map((item) => renderItemCard(item, false))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP EDIT / ADD MODAL DIALOG                                              */}
      {/* ========================================================================= */}
      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-stone-50/80 px-6 py-4 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      form.itemKind === "THALI"
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {form.itemKind === "THALI" ? "Thali" : "Add-on"}
                  </span>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                    {form.mealType}
                  </span>
                </div>
                <h2 id="modal-title" className="mt-1 font-serif text-2xl font-bold text-stone-900 truncate">
                  {editingId ? `Edit: ${form.name || "Item"}` : `Add New ${form.itemKind === "THALI" ? "Thali" : "Add-on / Dish"}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="menu-form" onSubmit={submitForm} className="overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Item name <span className="text-primary">*</span>
                </label>
                <Input
                  placeholder="e.g. Tangra Macher Thali"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Description <span className="text-primary">*</span>
                </label>
                <Textarea
                  placeholder="Appetizing homestyle Bengali description..."
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={2}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">
                    Price (INR) <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 149"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    required
                  />
                  <p className="text-xs text-stone-500">Number only, without ₹ symbol.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">
                    Badge tag <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 2 pcs, 1 plate, Best Seller"
                    value={form.badge}
                    onChange={(event) => setForm({ ...form, badge: event.target.value })}
                    required
                  />
                  <p className="text-xs text-stone-500">Shows on item card (e.g. &quot;1 plate&quot;, &quot;2 pcs&quot;).</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Category</label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/50"
                    value={form.itemKind}
                    onChange={(event) => setForm({ ...form, itemKind: event.target.value as "THALI" | "ADD_ON" })}
                  >
                    <option value="THALI">🍱 Thali (Set Meal)</option>
                    <option value="ADD_ON">🍛 Custom Dish / Add-on</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Meal slot</label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/50"
                    value={form.mealType}
                    onChange={(event) => setForm({ ...form, mealType: event.target.value as "LUNCH" | "DINNER" })}
                  >
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Daily Stock limit</label>
                  <Input
                    placeholder="20"
                    type="number"
                    min="0"
                    value={form.stockLimit}
                    onChange={(event) => setForm({ ...form, stockLimit: event.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Image Section */}
              <div className="space-y-3 rounded-2xl border border-border bg-stone-50/70 p-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Image Path / URL</label>
                  <Input
                    placeholder="/brand/chara-pona-thali.jpg or https://..."
                    value={form.imageUrl}
                    onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Or Upload a New Image
                  </label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <p className="text-xs text-stone-500">
                    JPG, PNG, or WebP under 5 MB. Automatically uploads and sets URL.
                  </p>
                </div>
                {form.imageUrl ? (
                  <div className="relative mt-2 overflow-hidden rounded-xl border border-stone-200">
                    <img
                      src={form.imageUrl}
                      alt={form.name || "Preview"}
                      className="h-32 w-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                      Current Preview
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Included Components */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Included components / items <span className="text-primary">*</span>
                </label>
                <Textarea
                  placeholder={
                    form.itemKind === "THALI"
                      ? "Rice, Moosor daal, Aloo potol kosha, Chutney, Papad, Salad"
                      : "1 plate · 1 fish piece"
                  }
                  value={form.components}
                  onChange={(event) => setForm({ ...form, components: event.target.value })}
                  rows={2}
                  required
                />
                <p className="text-xs text-stone-500">Separate items with commas.</p>
              </div>

              {message ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              ) : null}
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-stone-50/80 px-6 py-4 shrink-0">
              <Button
                variant="outline"
                type="button"
                onClick={resetForm}
                disabled={saving || uploadingImage}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="menu-form"
                disabled={saving || uploadingImage}
                className="bg-primary hover:bg-primary/90 text-white min-w-[130px]"
              >
                {saving ? "Saving..." : editingId ? "Update Item" : "Save Item"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
