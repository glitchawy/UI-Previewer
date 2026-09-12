import type { NavGroup, Tab } from "@/components/tb/shell";

const text = (ar: string, en: string) => ({ ar, en });

export const customerTabs: Tab[] = [
  { to: "/app", label: text("الرئيسية", "Home"), icon: "home" },
  { to: "/app/search", label: text("البحث", "Search"), icon: "search" },
  { to: "/app/cart", label: text("السلة", "Cart"), icon: "shopping_cart" },
  { to: "/app/orders", label: text("طلباتي", "My orders"), icon: "receipt_long" },
  { to: "/app/profile", label: text("حسابي", "Profile"), icon: "person" },
];

export const driverTabs: Tab[] = [
  { to: "/driver", label: text("الطلبات", "Orders"), icon: "two_wheeler" },
  { to: "/driver/history", label: text("السجل", "History"), icon: "history" },
  { to: "/driver/wallet", label: text("المحفظة", "Wallet"), icon: "account_balance_wallet" },
  { to: "/driver/profile", label: text("حسابي", "Profile"), icon: "person" },
];

/** Hook-compatible accessor retained for driver routes that render nav data. */
export function useDriverTabs(): Tab[] {
  return driverTabs;
}

export const partnerNav: NavGroup[] = [
  {
    label: text("التشغيل", "Operations"),
    items: [
      { to: "/partner", label: text("لوحة الأداء", "Performance"), icon: "space_dashboard" },
      { to: "/partner/orders", label: text("الطلبات", "Orders"), icon: "receipt_long" },
      { to: "/partner/branches", label: text("الفروع", "Branches"), icon: "store" },
      { to: "/partner/hours", label: text("مواعيد العمل", "Opening hours"), icon: "schedule" },
    ],
  },
  {
    label: text("القائمة", "Menu"),
    items: [
      { to: "/partner/menu", label: text("المنتجات", "Products"), icon: "restaurant_menu" },
      { to: "/partner/inventory", label: text("مخزون الفروع", "Branch inventory"), icon: "inventory_2" },
    ],
  },
  {
    label: text("الأعمال", "Business"),
    items: [
      { to: "/partner/analytics", label: text("التحليلات", "Analytics"), icon: "insights" },
      { to: "/partner/settlements", label: text("التسويات", "Settlements"), icon: "account_balance" },
      { to: "/partner/reviews", label: text("التقييمات", "Reviews"), icon: "reviews" },
      { to: "/partner/settings", label: text("بيانات المطعم", "Restaurant details"), icon: "settings" },
    ],
  },
];

/** Hook-compatible accessor retained for partner routes that render nav data. */
export function usePartnerNav(): NavGroup[] {
  return partnerNav;
}

export const branchNav: NavGroup[] = [];

export const adminNav: NavGroup[] = [
  {
    label: text("المنصة", "Platform"),
    items: [
      { to: "/admin", label: text("نظرة عامة", "Overview"), icon: "insights" },
      { to: "/admin/orders", label: text("الطلبات", "Orders"), icon: "fact_check" },
      { to: "/admin/customers", label: text("العملاء", "Customers"), icon: "group" },
    ],
  },
  {
    label: text("التوثيق", "Verification"),
    items: [
      { to: "/admin/restaurants", label: text("المطاعم", "Restaurants"), icon: "storefront" },
      { to: "/admin/drivers", label: text("المندوبين", "Drivers"), icon: "two_wheeler" },
    ],
  },
  {
    label: text("المالية", "Finance"),
    items: [
      { to: "/admin/settlements", label: text("التسويات", "Settlements"), icon: "account_balance" },
      { to: "/admin/payments", label: text("المدفوعات", "Payments"), icon: "credit_card" },
      { to: "/admin/refunds", label: text("الاستردادات", "Refunds"), icon: "currency_exchange" },
      { to: "/admin/pricing", label: text("تسعير التوصيل", "Delivery pricing"), icon: "route" },
      { to: "/admin/commissions", label: text("عمولات المطاعم", "Restaurant commissions"), icon: "percent" },
      { to: "/admin/driver-commissions", label: text("عمولات المندوبين", "Driver commissions"), icon: "two_wheeler" },
    ],
  },
  {
    label: text("الإدارة", "Administration"),
    items: [
      { to: "/admin/reviews", label: text("التقييمات", "Reviews"), icon: "reviews" },
      { to: "/admin/notifications", label: text("الإشعارات", "Notifications"), icon: "notifications_active" },
      { to: "/admin/reports", label: text("التقارير", "Reports"), icon: "table_view" },
      { to: "/admin/roles", label: text("الأدوار والصلاحيات", "Roles & permissions"), icon: "admin_panel_settings" },
      { to: "/admin/audit-logs", label: text("سجل التدقيق", "Audit log"), icon: "history" },
      { to: "/admin/settings", label: text("إعدادات المنصة", "Platform settings"), icon: "settings" },
    ],
  },
];