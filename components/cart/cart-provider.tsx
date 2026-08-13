"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { readBrowserCache, writeBrowserCache } from "@/lib/browser-cache";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  badge: string;
  mealType?: "LUNCH" | "DINNER";
  itemKind?: "THALI" | "ADD_ON";
  description?: string;
  components?: string[];
  customization?: string | null;
};

export type CartCandidate = Omit<CartItem, "quantity">;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  replaceWithSingleItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCustomization: (id: string, customization: string | null) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryDistanceKm: number | null;
  setDeliveryDistanceKm: (distanceKm: number | null) => void;
  availableAddOns: CartCandidate[];
  setAvailableAddOns: (items: CartCandidate[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "saswatis-kitchen-cart-v2";
const legacySessionStorageKey = "saswatis-kitchen-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<CartCandidate[]>([]);

  useEffect(() => {
    try {
      const cached = readBrowserCache<CartItem[]>(storageKey);
      const legacy = window.sessionStorage.getItem(legacySessionStorageKey);
      const parsed = cached ?? (legacy ? JSON.parse(legacy) : null);
      if (Array.isArray(parsed)) {
        setItems(
          parsed
            .filter((item) => item && typeof item.id === "string" && Number.isInteger(item.quantity) && item.quantity > 0)
            .slice(0, 40)
        );
      }
    } catch {
      // A bad cached cart should not break ordering.
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    writeBrowserCache(storageKey, items);
  }, [cartHydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      itemCount,
      deliveryDistanceKm,
      setDeliveryDistanceKm,
      availableAddOns,
      setAvailableAddOns,
      addItem(item, quantity = 1) {
        setItems((current) => {
          const existing = current.find((entry) => entry.id === item.id);
          if (existing) {
            return current.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + quantity }
                : entry
            );
          }

          return [...current, { ...item, quantity }];
        });
      },
      replaceWithSingleItem(item, quantity = 1) {
        setItems([{ ...item, quantity }]);
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      updateCustomization(id, customization) {
        setItems((current) =>
          current.map((item) => item.id === id ? { ...item, customization } : item)
        );
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [availableAddOns, deliveryDistanceKm, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
