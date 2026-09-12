import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useCallback, useEffect, useState } from "react";
import { getSession, getToken } from "@/lib/auth-session";
import { subscribeLocale } from "@/lib/i18n";
import type { DeliveryEstimate } from "@/lib/tb/delivery-estimate";

export type CartAddon = { id: number; name: string; price: number };
export type CartItem = {
  id: number; productId: number; name: string; imageUrl: string | null;
  quantity: number; unitPrice: number; subtotal: number;
  variant: { id: number; name: string } | null; addons: CartAddon[];
};
export type CartGroup = {
  restaurantId: number; restaurantName: string; deliveryType: string;
  acceptingOrders: boolean; acceptanceReason: string; nextOpeningSummary: string | null;
  items: CartItem[]; subtotal: number; deliveryEstimate?: DeliveryEstimate | null;
};
export type CartData = {
  restaurants: CartGroup[]; restaurantIds: number[]; itemCount: number; total: number;
};
export type AddCartInput = {
  productId: number; variantId: number | null; addonIds: number[];
  quantity?: number; replaceOtherRestaurants?: boolean;
};

const EMPTY: CartData = { restaurants: [], restaurantIds: [], itemCount: 0, total: 0 };
let cache: CartData = EMPTY;
let cacheToken: string | null = null;
let loading: Promise<CartData> | null = null;
const listeners = new Set<(cart: CartData) => void>();

function authHeaders(json = false): HeadersInit {
  const token = getToken();
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function publish(cart: CartData) { cache = cart; listeners.forEach((listener) => listener(cart)); }
function syncSession() {
  const token = getToken();
  if (token !== cacheToken) { cacheToken = token; loading = null; publish(EMPTY); }
  return token;
}
export async function refreshCart(): Promise<CartData> {
  const token = syncSession();
  if (!token || getSession()?.user.role !== "customer") return EMPTY;
  if (loading) return loading;
  loading = fetch("/api/cart", { headers: authHeaders() })
    .then(async (response) => {
      if (!response.ok) throw new Error("تعذر تحميل السلة");
      const cart = await response.json() as CartData;
      if (cacheToken === token) publish(cart);
      return cart;
    })
    .finally(() => { loading = null; });
  return loading;
}
export async function addCartItem(input: AddCartInput) {
  const response = await fetch("/api/cart/items", {
    method: "POST", headers: authHeaders(true), body: JSON.stringify(input),
  });
  const body = await response.json() as CartData | { error?: string };
  if (!response.ok) throw new Error("error" in body ? body.error || "تعذر الإضافة للسلة" : "تعذر الإضافة للسلة");
  publish(body as CartData);
  return body as CartData;
}
export async function updateCartItem(id: number, quantity: number) {
  const response = await fetch(`/api/cart/items/${id}`, {
    method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ quantity }),
  });
  const body = await response.json() as CartData | { error?: string };
  if (!response.ok) throw new Error("error" in body ? body.error || "تعذر تحديث السلة" : "تعذر تحديث السلة");
  publish(body as CartData);
}
export async function clearCart() {
  const response = await fetch("/api/cart", { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error("تعذر مسح السلة");
  publish(EMPTY);
}
export function resetCartAfterOrder() {
  publish(EMPTY);
}
export function useCart() {
  const [cart, setCart] = useState(() => { syncSession(); return cache; });
  const [isLoading, setIsLoading] = useState(cacheToken !== null && cache === EMPTY);
  useEffect(() => {
    listeners.add(setCart);
    setIsLoading(true);
    refreshCart().catch(() => {}).finally(() => setIsLoading(false));
    return () => { listeners.delete(setCart); };
  }, []);
  return { cart, isLoading, refresh: useCallback(() => refreshCart(), []) };
}

// Cart responses include localized restaurant, product, and availability fields.
// Refresh the module cache on language changes without resetting local cart
// state or remounting the page/form that is currently using it.
subscribeLocale(() => {
  void refreshCart().catch(() => {});
});