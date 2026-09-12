import type { OrderStatus, PaymentStatus } from "@workspace/api-client-react";
import { formatCurrency, formatDate, translate } from "@/lib/i18n";
type TranslationFunction = (ar: string, en: string, params?: Record<string, string | number>) => string;

const orderStatusCopy: Record<OrderStatus, [string, string]> = {
  pending: ["في انتظار التأكيد", "Awaiting confirmation"],
  confirmed: ["تم التأكيد", "Confirmed"],
  preparing: ["جاري التحضير", "Preparing"],
  ready: ["جاهز للاستلام", "Ready for pickup"],
  picked_up: ["خرج للتوصيل", "Out for delivery"],
  delivered: ["تم التوصيل", "Delivered"],
  cancelled: ["ملغي", "Cancelled"],
};

function translatedLabels<T extends string>(
  pairs: Record<T, [string, string]>,
): Record<T, string> {
  const labels = {} as Record<T, string>;
  for (const status of Object.keys(pairs) as T[]) {
    Object.defineProperty(labels, status, {
      enumerable: true,
      get: () => {
        const [ar, en] = pairs[status];
        return translate(ar, en);
      },
    });
  }
  return labels;
}

// Accessors intentionally translate on read rather than once at module load.
export const orderStatusLabels = translatedLabels(orderStatusCopy);

const paymentStatusCopy: Record<PaymentStatus, [string, string]> = {
  pending: ["في انتظار الدفع", "Payment pending"],
  paid: ["مدفوع", "Paid"],
  failed: ["فشل الدفع", "Payment failed"],
  refunded: ["تم الاسترداد", "Refunded"],
};

export function orderStatusLabel(status: OrderStatus, t: TranslationFunction) {
  const [ar, en] = orderStatusCopy[status];
  return t(ar, en);
}

export function paymentStatusLabel(status: PaymentStatus, t: TranslationFunction) {
  const [ar, en] = paymentStatusCopy[status];
  return t(ar, en);
}

export const orderStatusTones: Record<OrderStatus, "warn" | "info" | "success" | "danger"> = {
  pending: "warn",
  confirmed: "info",
  preparing: "info",
  ready: "success",
  picked_up: "success",
  delivered: "success",
  cancelled: "danger",
};

export const paymentStatusLabels = translatedLabels(paymentStatusCopy);

export const paymentStatusTones: Record<PaymentStatus, "warn" | "info" | "success" | "danger"> = {
  pending: "warn",
  paid: "success",
  failed: "danger",
  refunded: "info",
};

export const currentOrderStatuses = new Set<OrderStatus>([
  "pending", "confirmed", "preparing", "ready", "picked_up",
]);

export const EGP = (value: number | string) => formatCurrency(value);

export function formatOrderDate(value: string | Date) {
  return formatDate(value);
}