export const customerTabs = [
  { to: "/app", label: "الرئيسية", icon: "home" },
  { to: "/app/search", label: "البحث", icon: "search" },
  { to: "/app/cart", label: "السلة", icon: "shopping_cart" },
  { to: "/app/orders", label: "طلباتي", icon: "receipt_long" },
  { to: "/app/profile", label: "حسابي", icon: "person" },
];

export const driverTabs = [
  { to: "/driver", label: "الطلبات", icon: "two_wheeler" },
  { to: "/driver/history", label: "السجل", icon: "history" },
  { to: "/driver/wallet", label: "المحفظة", icon: "account_balance_wallet" },
  { to: "/driver/profile", label: "حسابي", icon: "person" },
];

export const partnerNav = [
  {
    label: "التشغيل",
    items: [
      { to: "/partner", label: "لوحة الأداء", icon: "space_dashboard" },
      { to: "/partner/orders", label: "الطلبات", icon: "receipt_long" },
      { to: "/partner/branches", label: "الفروع", icon: "store" },
      { to: "/partner/hours", label: "مواعيد العمل", icon: "schedule" },
    ],
  },
  {
    label: "القائمة",
    items: [
      { to: "/partner/menu", label: "المنتجات", icon: "restaurant_menu" },
      { to: "/partner/inventory", label: "مخزون الفروع", icon: "inventory_2" },
    ],
  },
  {
    label: "الأعمال",
    items: [
      { to: "/partner/analytics", label: "التحليلات", icon: "insights" },
      { to: "/partner/settlements", label: "التسويات", icon: "account_balance" },
      { to: "/partner/reviews", label: "التقييمات", icon: "reviews" },
      { to: "/partner/settings", label: "بيانات المطعم", icon: "settings" },
    ],
  },
];

export const branchNav: { label: string; items: { to: string; label: string; icon: string }[] }[] = [];

export const adminNav = [
  {
    label: "المنصة",
    items: [
      { to: "/admin", label: "نظرة عامة", icon: "insights" },
      { to: "/admin/orders", label: "الطلبات", icon: "fact_check" },
      { to: "/admin/customers", label: "العملاء", icon: "group" },
    ],
  },
  {
    label: "التوثيق",
    items: [
      { to: "/admin/restaurants", label: "المطاعم", icon: "storefront" },
      { to: "/admin/drivers", label: "المندوبين", icon: "two_wheeler" },
    ],
  },
  {
    label: "المالية",
    items: [
      { to: "/admin/settlements", label: "التسويات", icon: "account_balance" },
      { to: "/admin/payments", label: "المدفوعات", icon: "credit_card" },
      { to: "/admin/refunds", label: "الاستردادات", icon: "currency_exchange" },
      { to: "/admin/pricing", label: "تسعير التوصيل", icon: "route" },
      { to: "/admin/commissions", label: "عمولات المطاعم", icon: "percent" },
      { to: "/admin/driver-commissions", label: "عمولات المندوبين", icon: "two_wheeler" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { to: "/admin/reviews", label: "التقييمات", icon: "reviews" },
      { to: "/admin/notifications", label: "الإشعارات", icon: "notifications_active" },
      { to: "/admin/reports", label: "التقارير", icon: "table_view" },
      { to: "/admin/roles", label: "الأدوار والصلاحيات", icon: "admin_panel_settings" },
      { to: "/admin/audit-logs", label: "سجل التدقيق", icon: "history" },
      { to: "/admin/settings", label: "إعدادات المنصة", icon: "settings" },
    ],
  },
];

