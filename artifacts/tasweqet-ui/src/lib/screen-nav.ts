import { screenGroups } from "./screens";

/**
 * Presentation-only navigation map.
 *
 * The generated screens are static markup, so instead of rewriting every
 * anchor/button we resolve a tap target from the element's label + material
 * icon. This makes the mockups behave like a real app (tabs, flows, back
 * buttons) without adding any business logic.
 */

export type NavTarget = string | "back";

const BACK_ICONS = new Set([
  "arrow_forward",
  "arrow_forward_ios",
  "arrow_back",
  "arrow_back_ios",
  "arrow_back_ios_new",
  "west",
  "east",
  "close",
  "chevron_right",
]);

/** Bottom-tab / sidebar icons per app family. */
const TAB_ICONS: Record<string, Record<string, string>> = {
  customer: {
    home: "home-discovery",
    search: "search",
    storefront: "restaurant-listing",
    restaurant: "restaurant-listing",
    restaurant_menu: "restaurant-listing",
    local_cafe: "restaurant-listing",
    local_pharmacy: "pharmacy-listing",
    medication: "pharmacy-listing",
    shopping_cart: "shopping-cart",
    shopping_basket: "shopping-cart",
    shopping_bag: "shopping-cart",
    receipt_long: "my-orders",
    list_alt: "my-orders",
    local_shipping: "order-tracking",
    person: "profile",
    account_circle: "profile",
    credit_card: "checkout",
    add_location_alt: "add-address",
    location_on: "location-selection",
  },
  merchant: {
    dashboard: "merchant-dashboard-restaurant",
    space_dashboard: "merchant-dashboard-restaurant",
    storefront: "merchant-dashboard-restaurant",
    list_alt: "merchant-orders-management",
    receipt_long: "merchant-orders-management",
    inventory_2: "merchant-catalog-restaurant",
    restaurant_menu: "merchant-catalog-restaurant",
    bar_chart: "merchant-analytics",
    analytics: "merchant-analytics",
    insights: "merchant-analytics",
    notifications_active: "new-order-alert",
  },
  driver: {
    power_settings_new: "driver-home-online",
    two_wheeler: "driver-home-online",
    home: "driver-home-online",
    navigation: "navigation-to-customer",
    near_me: "navigation-to-customer",
    map: "driver-operations-mobile",
    payments: "driver-earnings-dashboard",
    account_balance_wallet: "driver-earnings-dashboard",
    wallet: "driver-earnings-dashboard",
    verified: "delivery-completed",
  },
  admin: {
    insights: "admin-dashboard-overview-mobile",
    dashboard: "admin-dashboard-overview-mobile",
    space_dashboard: "admin-dashboard-overview-mobile",
    fact_check: "admin-orders-management-mobile",
    list_alt: "admin-orders-management-mobile",
    receipt_long: "admin-orders-management-mobile",
    verified_user: "merchant-management-mobile",
    storefront: "merchant-management-mobile",
    store: "merchant-management-mobile",
    account_balance: "finance-payouts-mobile",
    payments: "finance-payouts-mobile",
    savings: "finance-payouts-mobile",
  },
  onboarding: {
    login: "login-screen",
    person_add: "sign-up-screen",
    my_location: "location-selection",
    storefront: "business-type-selection",
  },
};

/** Text (Arabic) fallbacks, checked in order. */
const TEXT_RULES: Array<[RegExp, string]> = [
  [/إنشاء حساب|حساب جديد|سجل معنا/, "sign-up-screen"],
  [/تسجيل الدخول|دخول/, "login-screen"],
  [/تأكيد الكود|رمز التحقق/, "otp-verification"],
  [/تحديد الموقع|موقعي/, "location-selection"],
  [/نوع النشاط/, "business-type-selection"],
  [/مطاعم|مطعم/, "restaurant-listing"],
  [/صيدلي/, "pharmacy-listing"],
  [/سوبر ماركت|متاجر|كافيهات/, "restaurant-listing"],
  [/السلة|سلة/, "shopping-cart"],
  [/إتمام|تأكيد الطلب|الدفع/, "checkout"],
  [/عنوان/, "add-address"],
  [/تتبع/, "order-tracking"],
  [/طلباتي|سجل الطلبات/, "my-orders"],
  [/حسابي|الملف الشخصي/, "profile"],
  [/الرئيسية/, "home-discovery"],
  [/بحث|دور على/, "search"],
  [/الأرباح|المحفظة/, "driver-earnings-dashboard"],
  [/التحليلات|المبيعات/, "merchant-analytics"],
  [/المنتجات|القائمة|المنيو/, "merchant-catalog-restaurant"],
  [/إدارة الطلبات|الطلبات/, "merchant-orders-management"],
];

/** Screen-specific rules: the primary flow of each mockup. */
const SCREEN_RULES: Record<string, Array<[RegExp, NavTarget]>> = {
  "welcome-screen": [
    [/ضيف|تصفح/, "home-discovery"],
    [/إنشاء|جديد|تسجيل حساب/, "sign-up-screen"],
    [/ابدأ|دخول|تسجيل|متابعة|استمرار/, "login-screen"],
  ],
  "login-screen": [
    [/إنشاء|جديد/, "sign-up-screen"],
    [/دخول|متابعة|استمرار|Google|Apple/i, "otp-verification"],
  ],
  "sign-up-screen": [
    [/دخول بالفعل|لديك حساب/, "login-screen"],
    [/إنشاء|متابعة|تسجيل|استمرار/, "otp-verification"],
  ],
  "otp-verification": [[/تأكيد|متابعة|تحقق|استمرار/, "location-selection"]],
  "location-selection": [[/تأكيد|متابعة|استمرار|حفظ|توصيل/, "home-discovery"]],
  "business-type-selection": [[/متابعة|تأكيد|استمرار|مطعم|متجر|صيدلية/, "merchant-dashboard-restaurant"]],
  "home-discovery": [
    [/اطلب دلوقتي|عرض الكل|خصم/, "restaurant-listing"],
    [/برجر|بيتزا|هاوس|روما/, "store-details-restaurant"],
  ],
  search: [[/برجر|بيتزا|مطعم|نتيجة/, "store-details-restaurant"]],
  "restaurant-listing": [[/./, "store-details-restaurant"]],
  "pharmacy-listing": [[/./, "store-details-restaurant"]],
  "store-details-restaurant": [
    [/السلة|عرض السلة/, "shopping-cart"],
    [/إضافة|أضف|ج\.م|جنيه|برجر|وجبة/, "product-details-burger"],
  ],
  "product-details-burger": [[/أضف|إضافة|السلة|اطلب/, "shopping-cart"]],
  "shopping-cart": [
    [/عنوان|تغيير/, "add-address"],
    [/إتمام|متابعة|الدفع|تأكيد/, "checkout"],
  ],
  "add-address": [[/حفظ|تأكيد|متابعة|استخدام/, "checkout"]],
  checkout: [
    [/عنوان|تغيير/, "add-address"],
    [/تأكيد الطلب|ادفع|إتمام/, "order-success"],
  ],
  "order-success": [
    [/طلباتي/, "my-orders"],
    [/تتبع|متابعة|الرئيسية/, "order-tracking"],
  ],
  "order-tracking": [[/تم|إغلاق|طلباتي|تقييم/, "my-orders"]],
  "my-orders": [[/تتبع|تفاصيل|إعادة/, "order-tracking"]],
  profile: [
    [/عنوان/, "add-address"],
    [/طلبات/, "my-orders"],
    [/خروج/, "welcome-screen"],
  ],
  "merchant-dashboard-restaurant": [
    [/طلب جديد|تنبيه/, "new-order-alert"],
    [/الطلبات/, "merchant-orders-management"],
    [/المنتجات|القائمة/, "merchant-catalog-restaurant"],
    [/تحليلات|المبيعات|التقارير/, "merchant-analytics"],
  ],
  "new-order-alert": [
    [/قبول|موافقة|تجهيز/, "merchant-orders-management"],
    [/رفض|لاحقاً|إغلاق/, "merchant-dashboard-restaurant"],
  ],
  "merchant-orders-management": [[/تفاصيل|تجهيز|جاهز/, "merchant-dashboard-restaurant"]],
  "merchant-catalog-restaurant": [[/إضافة|تعديل/, "merchant-catalog-restaurant"]],
  "driver-home-online": [
    [/طلب|توصيل جديد|متاح/, "new-delivery-request"],
    [/أرباح|المحفظة/, "driver-earnings-dashboard"],
  ],
  "new-delivery-request": [
    [/قبول|موافقة|استلام/, "navigation-to-customer"],
    [/رفض|تجاهل/, "driver-home-online"],
  ],
  "navigation-to-customer": [[/تم التوصيل|وصلت|تسليم|إتمام/, "delivery-completed"]],
  "delivery-completed": [[/التالي|طلب جديد|إنهاء|الرئيسية|تم/, "driver-home-online"]],
  "driver-earnings-dashboard": [[/تحويل|سحب/, "driver-earnings-dashboard"]],
  "admin-dashboard-overview-mobile": [
    [/الطلبات/, "admin-orders-management-mobile"],
    [/التجار|توثيق/, "merchant-management-mobile"],
    [/المالية|التحويلات|المدفوعات/, "finance-payouts-mobile"],
  ],
  "merchant-management-mobile": [[/توثيق|قبول|مراجعة/, "merchant-management-mobile"]],
};

const FAMILY_BY_SLUG: Record<string, string> = Object.fromEntries(
  screenGroups.flatMap((g) => g.screens.map((s) => [s.slug, g.id])),
);

export function familyOf(slug: string): string {
  return FAMILY_BY_SLUG[slug] ?? "customer";
}

export function resolveNavTarget(
  currentSlug: string,
  label: string,
  icons: string[],
): NavTarget | null {
  const text = label.replace(/\s+/g, " ").trim();

  // Pure back-affordances (icon only, no meaningful label).
  if (icons.some((i) => BACK_ICONS.has(i)) && text.length <= 2) return "back";

  for (const [pattern, target] of SCREEN_RULES[currentSlug] ?? []) {
    if (pattern.test(text)) return target === currentSlug ? null : target;
  }

  const family = familyOf(currentSlug);
  const tabs = TAB_ICONS[family] ?? {};
  for (const icon of icons) {
    const target = tabs[icon];
    if (target) return target === currentSlug ? null : target;
  }

  for (const [pattern, target] of TEXT_RULES) {
    if (pattern.test(text)) return target === currentSlug ? null : target;
  }

  return null;
}
