import type { OrderStatus } from "@workspace/api-client-react";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "في انتظار التأكيد",
  confirmed: "تم التأكيد",
  preparing: "جاري التحضير",
  ready: "جاهز للاستلام",
  picked_up: "خرج للتوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export const orderStatusTones: Record<OrderStatus, "warn" | "info" | "success" | "danger"> = {
  pending: "warn",
  confirmed: "info",
  preparing: "info",
  ready: "success",
  picked_up: "success",
  delivered: "success",
  cancelled: "danger",
};

export const currentOrderStatuses = new Set<OrderStatus>([
  "pending", "confirmed", "preparing", "ready", "picked_up",
]);

export const EGP = (value: number) => `${value.toLocaleString("ar-EG")} ج.م`;

export function formatOrderDate(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}