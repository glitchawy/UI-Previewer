export type ScreenEntry = {
  slug: string;
  title: string;
  icon: string;
};

export type ScreenGroup = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  screens: ScreenEntry[];
};

export const screenGroups: ScreenGroup[] = [
  {
    id: "onboarding",
    label: "التسجيل والبداية",
    subtitle: "شاشات الترحيب والدخول وتحديد الموقع",
    icon: "waving_hand",
    screens: [
      { slug: "splash-screen", title: "شاشة البداية", icon: "bolt" },
      { slug: "welcome-screen", title: "الترحيب", icon: "waving_hand" },
      { slug: "login-screen", title: "تسجيل الدخول", icon: "login" },
      { slug: "sign-up-screen", title: "إنشاء حساب", icon: "person_add" },
      { slug: "otp-verification", title: "تأكيد الكود", icon: "pin" },
      { slug: "location-selection", title: "تحديد الموقع", icon: "my_location" },
      { slug: "business-type-selection", title: "نوع النشاط", icon: "storefront" },
    ],
  },
  {
    id: "customer",
    label: "تطبيق العميل",
    subtitle: "التسوق، السلة، الدفع وتتبع الطلب",
    icon: "shopping_bag",
    screens: [
      { slug: "home-discovery", title: "الرئيسية", icon: "home" },
      { slug: "search", title: "البحث", icon: "search" },
      { slug: "restaurant-listing", title: "المطاعم", icon: "restaurant" },
      { slug: "pharmacy-listing", title: "الصيدليات", icon: "local_pharmacy" },
      { slug: "store-details-restaurant", title: "صفحة المتجر", icon: "store" },
      { slug: "product-details-burger", title: "تفاصيل المنتج", icon: "lunch_dining" },
      { slug: "shopping-cart", title: "سلة المشتريات", icon: "shopping_cart" },
      { slug: "add-address", title: "إضافة عنوان", icon: "add_location_alt" },
      { slug: "checkout", title: "إتمام الدفع", icon: "credit_card" },
      { slug: "order-success", title: "تم الطلب", icon: "task_alt" },
      { slug: "order-tracking", title: "تتبع الطلب", icon: "local_shipping" },
      { slug: "my-orders", title: "طلباتي", icon: "receipt_long" },
      { slug: "profile", title: "حسابي", icon: "person" },
    ],
  },
  {
    id: "merchant",
    label: "تطبيق التاجر",
    subtitle: "الطلبات، المنتجات والتحليلات",
    icon: "storefront",
    screens: [
      { slug: "merchant-dashboard-restaurant", title: "لوحة التحكم", icon: "dashboard" },
      { slug: "new-order-alert", title: "تنبيه طلب جديد", icon: "notifications_active" },
      { slug: "merchant-orders-management", title: "إدارة الطلبات", icon: "list_alt" },
      { slug: "merchant-catalog-restaurant", title: "إدارة المنتجات", icon: "inventory_2" },
      { slug: "merchant-analytics", title: "تحليلات المبيعات", icon: "bar_chart" },
    ],
  },
  {
    id: "driver",
    label: "تطبيق المندوب",
    subtitle: "الطلبات، الملاحة والأرباح",
    icon: "two_wheeler",
    screens: [
      { slug: "driver-home-online", title: "متصل الآن", icon: "power_settings_new" },
      { slug: "new-delivery-request", title: "طلب توصيل جديد", icon: "notification_important" },
      { slug: "navigation-to-customer", title: "الملاحة للعميل", icon: "navigation" },
      { slug: "delivery-completed", title: "تم التوصيل", icon: "verified" },
      { slug: "driver-earnings-dashboard", title: "الأرباح", icon: "payments" },
      { slug: "driver-operations-mobile", title: "عمليات المندوبين", icon: "map" },
    ],
  },
  {
    id: "admin",
    label: "لوحة الإدارة",
    subtitle: "المتابعة، التجار والمدفوعات",
    icon: "admin_panel_settings",
    screens: [
      { slug: "admin-dashboard-overview-mobile", title: "نظرة عامة", icon: "insights" },
      { slug: "admin-orders-management-mobile", title: "إدارة الطلبات", icon: "fact_check" },
      { slug: "merchant-management-mobile", title: "توثيق التجار", icon: "verified_user" },
      { slug: "finance-payouts-mobile", title: "المالية والتحويلات", icon: "account_balance" },
    ],
  },
];

export const totalScreens = screenGroups.reduce((n, g) => n + g.screens.length, 0);
