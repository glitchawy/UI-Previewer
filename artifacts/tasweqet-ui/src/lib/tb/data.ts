/**
 * Presentation-only mock data for the Talabat Betak UI rebuild.
 * No business logic lives here — these are static fixtures that let every
 * screen render realistic Arabic content.
 */

import { formatCurrency } from "@/lib/i18n";

export const EGP = (n: number | string) => formatCurrency(n);

export type Category = { id: string; name: string; icon: string };

export const categories: Category[] = [
  { id: "burger", name: "برجر", icon: "lunch_dining" },
  { id: "pizza", name: "بيتزا", icon: "local_pizza" },
  { id: "grill", name: "مشويات", icon: "outdoor_grill" },
  { id: "seafood", name: "أسماك", icon: "set_meal" },
  { id: "dessert", name: "حلويات", icon: "icecream" },
  { id: "drinks", name: "مشروبات", icon: "local_cafe" },
  { id: "koshary", name: "كشري", icon: "rice_bowl" },
  { id: "breakfast", name: "فطار", icon: "egg_alt" },
];

export type Addon = { id: string; name: string; price: number };
export type Variation = { id: string; name: string; price: number };

export type Product = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  rating: number;
  variations: Variation[];
  addons: Addon[];
};

export type Restaurant = {
  id: string;
  name: string;
  cover: string;
  logo: string;
  description: string;
  categories: string[];
  rating: number;
  reviews: number;
  distanceKm: number;
  etaMin: number;
  deliveryProvider: "RESTAURANT" | "TALABAT_BETAK";
  deliveryFee: number;
  commission: number;
  open: boolean;
  offer?: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  status: "ACTIVE" | "PENDING" | "UNDER_REVIEW" | "REJECTED";
  branches: number;
};

const img = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

export const restaurants: Restaurant[] = [
  {
    id: "burger-house",
    name: "برجر هاوس",
    cover: img("photo-1568901346375-23c9450c58cd"),
    logo: img("photo-1550547660-d9450f859349"),
    description: "برجر طازة على الفحم، أشهر مطعم برجر في المعادي.",
    categories: ["burger", "drinks"],
    rating: 4.8,
    reviews: 1240,
    distanceKm: 2.4,
    etaMin: 25,
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 20,
    commission: 15,
    open: true,
    offer: "خصم 20% على أول طلب",
    phone: "0100 123 4567",
    email: "info@burgerhouse.eg",
    address: "شارع 9، المعادي، القاهرة",
    hours: "10:00 ص — 2:00 ص",
    status: "ACTIVE",
    branches: 3,
  },
  {
    id: "pizza-roma",
    name: "بيتزا روما",
    cover: img("photo-1513104890138-7c749659a591"),
    logo: img("photo-1571997478779-2adcbbe9ab2f"),
    description: "بيتزا إيطالي أصلي في فرن حجري.",
    categories: ["pizza"],
    rating: 4.6,
    reviews: 860,
    distanceKm: 3.9,
    etaMin: 35,
    deliveryProvider: "RESTAURANT",
    deliveryFee: 25,
    commission: 12,
    open: true,
    offer: "بيتزا وسط بـ 99 ج.م",
    phone: "0100 555 8899",
    email: "hello@pizzaroma.eg",
    address: "شارع النزهة، مصر الجديدة",
    hours: "12:00 م — 1:00 ص",
    status: "ACTIVE",
    branches: 2,
  },
  {
    id: "grill-station",
    name: "محطة المشويات",
    cover: img("photo-1544025162-d76694265947"),
    logo: img("photo-1529193591184-b1d58069ecdd"),
    description: "كباب وكفتة ومشويات مصرية أصلية.",
    categories: ["grill"],
    rating: 4.4,
    reviews: 512,
    distanceKm: 5.2,
    etaMin: 45,
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 30,
    commission: 18,
    open: true,
    phone: "0111 222 3344",
    email: "grill@station.eg",
    address: "شارع الهرم، الجيزة",
    hours: "1:00 م — 3:00 ص",
    status: "ACTIVE",
    branches: 1,
  },
  {
    id: "koshary-tahrir",
    name: "كشري التحرير",
    cover: img("photo-1512058564366-18510be2db19"),
    logo: img("photo-1466637574441-749b8f19452f"),
    description: "كشري مصري بالدقة القديمة.",
    categories: ["koshary"],
    rating: 4.9,
    reviews: 2210,
    distanceKm: 1.1,
    etaMin: 20,
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 15,
    commission: 10,
    open: false,
    phone: "0122 444 5566",
    email: "koshary@tahrir.eg",
    address: "ميدان التحرير، القاهرة",
    hours: "9:00 ص — 12:00 ص",
    status: "ACTIVE",
    branches: 4,
  },
  {
    id: "sweet-corner",
    name: "ركن الحلويات",
    cover: img("photo-1551024506-0bccd828d307"),
    logo: img("photo-1563729784474-d77dbb933a9e"),
    description: "بسبوسة، كنافة وحلويات شرقية.",
    categories: ["dessert", "drinks"],
    rating: 4.5,
    reviews: 340,
    distanceKm: 6.8,
    etaMin: 40,
    deliveryProvider: "RESTAURANT",
    deliveryFee: 22,
    commission: 14,
    open: true,
    phone: "0155 777 8899",
    email: "sweet@corner.eg",
    address: "شارع جسر السويس، القاهرة",
    hours: "11:00 ص — 2:00 ص",
    status: "ACTIVE",
    branches: 2,
  },
  {
    id: "fish-market",
    name: "سوق السمك",
    cover: img("photo-1519708227418-c8fd9a32b7a2"),
    logo: img("photo-1498654896293-37aacf113fd9"),
    description: "أسماك طازة يومياً من الإسكندرية.",
    categories: ["seafood"],
    rating: 4.2,
    reviews: 190,
    distanceKm: 8.3,
    etaMin: 55,
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 35,
    commission: 15,
    open: true,
    phone: "0100 909 1122",
    email: "fish@market.eg",
    address: "كورنيش النيل، المعادي",
    hours: "12:00 م — 12:00 ص",
    status: "PENDING",
    branches: 1,
  },
];

export const products: Product[] = [
  {
    id: "classic-burger",
    restaurantId: "burger-house",
    name: "برجر كلاسيك",
    description: "لحم بقري 200 جم، جبنة شيدر، خس، طماطم وصوص البيت.",
    price: 120,
    category: "burger",
    image: img("photo-1568901346375-23c9450c58cd"),
    available: true,
    rating: 4.8,
    variations: [
      { id: "s", name: "سنجل", price: 0 },
      { id: "m", name: "دوبل", price: 45 },
      { id: "l", name: "تربل", price: 85 },
    ],
    addons: [
      { id: "cheese", name: "جبنة إضافية", price: 15 },
      { id: "sauce", name: "صوص إضافي", price: 8 },
      { id: "meat", name: "لحمة إضافية", price: 40 },
      { id: "bacon", name: "بسطرمة", price: 25 },
    ],
  },
  {
    id: "chicken-burger",
    restaurantId: "burger-house",
    name: "تشيكن كرانشي",
    description: "صدور فراخ مقرمشة مع صوص الرانش.",
    price: 95,
    category: "burger",
    image: img("photo-1606755962773-d324e0a13086"),
    available: true,
    rating: 4.5,
    variations: [
      { id: "s", name: "سنجل", price: 0 },
      { id: "m", name: "دوبل", price: 35 },
    ],
    addons: [
      { id: "cheese", name: "جبنة إضافية", price: 15 },
      { id: "fries", name: "بطاطس", price: 20 },
    ],
  },
  {
    id: "margherita",
    restaurantId: "pizza-roma",
    name: "بيتزا مارجريتا",
    description: "صوص طماطم، موتزاريلا وريحان طازج.",
    price: 140,
    category: "pizza",
    image: img("photo-1574071318508-1cdbab80d002"),
    available: true,
    rating: 4.7,
    variations: [
      { id: "s", name: "صغير", price: 0 },
      { id: "m", name: "وسط", price: 40 },
      { id: "l", name: "كبير", price: 80 },
    ],
    addons: [
      { id: "cheese", name: "جبنة إضافية", price: 20 },
      { id: "olive", name: "زيتون", price: 10 },
    ],
  },
  {
    id: "pepperoni",
    restaurantId: "pizza-roma",
    name: "بيتزا بيبروني",
    description: "بيبروني حار مع موتزاريلا مدخنة.",
    price: 165,
    category: "pizza",
    image: img("photo-1534308983496-4fabb1a015ee"),
    available: false,
    rating: 4.6,
    variations: [
      { id: "m", name: "وسط", price: 0 },
      { id: "l", name: "كبير", price: 50 },
    ],
    addons: [{ id: "cheese", name: "جبنة إضافية", price: 20 }],
  },
  {
    id: "mixed-grill",
    restaurantId: "grill-station",
    name: "مشاوي مشكلة",
    description: "كباب، كفتة وشيش طاووق مع الأرز والسلطات.",
    price: 320,
    category: "grill",
    image: img("photo-1555939594-58d7cb561ad1"),
    available: true,
    rating: 4.4,
    variations: [
      { id: "1", name: "فرد", price: 0 },
      { id: "2", name: "٢ أفراد", price: 260 },
    ],
    addons: [
      { id: "rice", name: "أرز إضافي", price: 25 },
      { id: "tahina", name: "طحينة", price: 12 },
    ],
  },
  {
    id: "koshary-large",
    restaurantId: "koshary-tahrir",
    name: "كشري كبير",
    description: "عدس، أرز، مكرونة، حمص وبصل مقلي.",
    price: 45,
    category: "koshary",
    image: img("photo-1512058564366-18510be2db19"),
    available: true,
    rating: 4.9,
    variations: [
      { id: "s", name: "صغير", price: -15 },
      { id: "m", name: "وسط", price: 0 },
      { id: "l", name: "عائلي", price: 40 },
    ],
    addons: [
      { id: "shatta", name: "شطة", price: 3 },
      { id: "dakka", name: "دقة", price: 3 },
    ],
  },
  {
    id: "konafa",
    restaurantId: "sweet-corner",
    name: "كنافة بالمانجو",
    description: "كنافة ناعمة بالقشطة والمانجو الطازجة.",
    price: 85,
    category: "dessert",
    image: img("photo-1551024506-0bccd828d307"),
    available: true,
    rating: 4.5,
    variations: [
      { id: "p", name: "قطعة", price: 0 },
      { id: "t", name: "صينية", price: 180 },
    ],
    addons: [{ id: "nuts", name: "مكسرات", price: 20 }],
  },
];

export const productsOf = (restaurantId: string) =>
  products.filter((p) => p.restaurantId === restaurantId);

export const restaurantOf = (id: string) => restaurants.find((r) => r.id === id);
export const productOf = (id: string) => products.find((p) => p.id === id);

/* ----------------------------- Cart (multi-restaurant) ---------------------------- */

export type CartLine = {
  productId: string;
  name: string;
  variation: string;
  addons: string[];
  qty: number;
  price: number;
  image: string;
};

export type CartGroup = {
  restaurantId: string;
  restaurantName: string;
  deliveryProvider: Restaurant["deliveryProvider"];
  deliveryFee: number;
  lines: CartLine[];
};

export const cart: CartGroup[] = [
  {
    restaurantId: "burger-house",
    restaurantName: "برجر هاوس",
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 20,
    lines: [
      {
        productId: "classic-burger",
        name: "برجر كلاسيك",
        variation: "دوبل",
        addons: ["جبنة إضافية", "بسطرمة"],
        qty: 2,
        price: 205,
        image: img("photo-1568901346375-23c9450c58cd"),
      },
      {
        productId: "chicken-burger",
        name: "تشيكن كرانشي",
        variation: "سنجل",
        addons: ["بطاطس"],
        qty: 1,
        price: 115,
        image: img("photo-1606755962773-d324e0a13086"),
      },
    ],
  },
  {
    restaurantId: "koshary-tahrir",
    restaurantName: "كشري التحرير",
    deliveryProvider: "TALABAT_BETAK",
    deliveryFee: 15,
    lines: [
      {
        productId: "koshary-large",
        name: "كشري عائلي",
        variation: "عائلي",
        addons: ["شطة"],
        qty: 1,
        price: 88,
        image: img("photo-1512058564366-18510be2db19"),
      },
    ],
  },
];

export const cartTotals = () => {
  const subtotal = cart.reduce(
    (s, g) => s + g.lines.reduce((x, l) => x + l.price * l.qty, 0),
    0,
  );
  const delivery = cart.reduce((s, g) => s + g.deliveryFee, 0);
  return { subtotal, delivery, total: subtotal + delivery, groups: cart.length };
};

/* --------------------------------- Orders --------------------------------- */

export const ORDER_STATES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "DELIVERING",
  "DELIVERED",
] as const;
export type OrderState = (typeof ORDER_STATES)[number] | "CANCELLED";

export const stateLabels: Record<string, string> = {
  PLACED: "تم الطلب",
  CONFIRMED: "تم التأكيد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  ASSIGNED: "تم تعيين مندوب",
  PICKED_UP: "تم الاستلام",
  DELIVERING: "في الطريق",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export type SubOrder = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  branch: string;
  status: OrderState;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  deliveryProvider: Restaurant["deliveryProvider"];
  driver?: string;
};

export type Order = {
  id: string;
  code: string;
  placedAt: string;
  customer: string;
  customerPhone: string;
  address: string;
  payment: "CASH" | "CARD" | "WALLET";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  status: OrderState;
  subOrders: SubOrder[];
  total: number;
  commission: number;
  cancelReason?: string;
};

export const orders: Order[] = [
  {
    id: "12345",
    code: "#12345",
    placedAt: "اليوم 14:32",
    customer: "أحمد محمود",
    customerPhone: "0100 123 4567",
    address: "٧ شارع ٩، المعادي، الدور ٣، شقة ٦",
    payment: "CARD",
    paymentStatus: "SUCCESS",
    status: "DELIVERING",
    total: 623,
    commission: 78,
    subOrders: [
      {
        id: "12345-A",
        restaurantId: "burger-house",
        restaurantName: "برجر هاوس",
        branch: "فرع المعادي",
        status: "PICKED_UP",
        deliveryProvider: "TALABAT_BETAK",
        deliveryFee: 20,
        subtotal: 525,
        driver: "محمود سعيد",
        items: [
          { name: "برجر كلاسيك دوبل", qty: 2, price: 205 },
          { name: "تشيكن كرانشي", qty: 1, price: 115 },
        ],
      },
      {
        id: "12345-B",
        restaurantId: "koshary-tahrir",
        restaurantName: "كشري التحرير",
        branch: "فرع التحرير",
        status: "PREPARING",
        deliveryProvider: "TALABAT_BETAK",
        deliveryFee: 15,
        subtotal: 88,
        items: [{ name: "كشري عائلي", qty: 1, price: 88 }],
      },
    ],
  },
  {
    id: "12344",
    code: "#12344",
    placedAt: "اليوم 12:10",
    customer: "سارة علي",
    customerPhone: "0111 987 6543",
    address: "١٢ شارع النزهة، مصر الجديدة",
    payment: "CASH",
    paymentStatus: "PENDING",
    status: "PREPARING",
    total: 205,
    commission: 24,
    subOrders: [
      {
        id: "12344-A",
        restaurantId: "pizza-roma",
        restaurantName: "بيتزا روما",
        branch: "فرع مصر الجديدة",
        status: "PREPARING",
        deliveryProvider: "RESTAURANT",
        deliveryFee: 25,
        subtotal: 180,
        items: [{ name: "بيتزا مارجريتا وسط", qty: 1, price: 180 }],
      },
    ],
  },
  {
    id: "12343",
    code: "#12343",
    placedAt: "أمس 21:44",
    customer: "محمد خالد",
    customerPhone: "0122 333 4455",
    address: "شارع الهرم، الجيزة",
    payment: "WALLET",
    paymentStatus: "SUCCESS",
    status: "DELIVERED",
    total: 350,
    commission: 57,
    subOrders: [
      {
        id: "12343-A",
        restaurantId: "grill-station",
        restaurantName: "محطة المشويات",
        branch: "الفرع الرئيسي",
        status: "DELIVERED",
        deliveryProvider: "TALABAT_BETAK",
        deliveryFee: 30,
        subtotal: 320,
        driver: "كريم فتحي",
        items: [{ name: "مشاوي مشكلة", qty: 1, price: 320 }],
      },
    ],
  },
  {
    id: "12342",
    code: "#12342",
    placedAt: "أمس 18:02",
    customer: "نورهان سمير",
    customerPhone: "0155 111 2233",
    address: "جسر السويس، القاهرة",
    payment: "CARD",
    paymentStatus: "REFUNDED",
    status: "CANCELLED",
    cancelReason: "تأخر المطعم في التأكيد",
    total: 105,
    commission: 0,
    subOrders: [
      {
        id: "12342-A",
        restaurantId: "sweet-corner",
        restaurantName: "ركن الحلويات",
        branch: "فرع مدينة نصر",
        status: "CANCELLED",
        deliveryProvider: "RESTAURANT",
        deliveryFee: 22,
        subtotal: 85,
        items: [{ name: "كنافة بالمانجو", qty: 1, price: 85 }],
      },
    ],
  },
];

export const orderOf = (id: string) => orders.find((o) => o.id === id) ?? orders[0]!;

export type HistoryEntry = {
  status: OrderState;
  actor: string;
  role: string;
  at: string;
};

export const orderHistory: HistoryEntry[] = [
  { status: "PLACED", actor: "أحمد محمود", role: "عميل", at: "14:32" },
  { status: "CONFIRMED", actor: "فرع المعادي", role: "مدير فرع", at: "14:34" },
  { status: "PREPARING", actor: "محمد (مطبخ)", role: "موظف فرع", at: "14:36" },
  { status: "READY", actor: "محمد (مطبخ)", role: "موظف فرع", at: "14:52" },
  { status: "ASSIGNED", actor: "النظام", role: "تلقائي", at: "14:53" },
  { status: "PICKED_UP", actor: "محمود سعيد", role: "مندوب", at: "14:58" },
  { status: "DELIVERING", actor: "محمود سعيد", role: "مندوب", at: "15:00" },
];

/* --------------------------------- People --------------------------------- */

export type Branch = {
  id: string;
  name: string;
  area: string;
  phone: string;
  manager: string;
  staff: number;
  ordersToday: number;
  open: boolean;
};

export const branches: Branch[] = [
  { id: "maadi", name: "فرع المعادي", area: "المعادي", phone: "0100 123 4567", manager: "هاني رمضان", staff: 8, ordersToday: 62, open: true },
  { id: "nasr", name: "فرع مدينة نصر", area: "مدينة نصر", phone: "0100 123 4568", manager: "دينا فؤاد", staff: 6, ordersToday: 41, open: true },
  { id: "dokki", name: "فرع الدقي", area: "الدقي", phone: "0100 123 4569", manager: "أسامة نبيل", staff: 5, ordersToday: 18, open: false },
];

export type Staff = {
  id: string;
  name: string;
  role: "مدير فرع" | "كاشير" | "مطبخ" | "خدمة عملاء";
  branch: string;
  phone: string;
  active: boolean;
};

export const staff: Staff[] = [
  { id: "s1", name: "هاني رمضان", role: "مدير فرع", branch: "فرع المعادي", phone: "0100 111 2222", active: true },
  { id: "s2", name: "محمد سيد", role: "مطبخ", branch: "فرع المعادي", phone: "0100 333 4444", active: true },
  { id: "s3", name: "دينا فؤاد", role: "مدير فرع", branch: "فرع مدينة نصر", phone: "0111 555 6666", active: true },
  { id: "s4", name: "كريم عادل", role: "كاشير", branch: "فرع مدينة نصر", phone: "0122 777 8888", active: false },
  { id: "s5", name: "أسامة نبيل", role: "مدير فرع", branch: "فرع الدقي", phone: "0155 999 0000", active: true },
];

export type Driver = {
  id: string;
  name: string;
  phone: string;
  type: "TALABAT_BETAK" | "RESTAURANT";
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
  online: boolean;
  rating: number;
  deliveries: number;
  area: string;
  vehicle: string;
  distanceKm: number;
};

export const drivers: Driver[] = [
  { id: "d1", name: "محمود سعيد", phone: "0100 222 3333", type: "TALABAT_BETAK", status: "APPROVED", online: true, rating: 4.9, deliveries: 1420, area: "المعادي", vehicle: "موتوسيكل", distanceKm: 1.2 },
  { id: "d2", name: "كريم فتحي", phone: "0111 444 5555", type: "TALABAT_BETAK", status: "APPROVED", online: true, rating: 4.7, deliveries: 980, area: "مدينة نصر", vehicle: "موتوسيكل", distanceKm: 2.6 },
  { id: "d3", name: "أحمد جمال", phone: "0122 666 7777", type: "TALABAT_BETAK", status: "UNDER_REVIEW", online: false, rating: 0, deliveries: 0, area: "الدقي", vehicle: "دراجة", distanceKm: 4.1 },
  { id: "d4", name: "مصطفى وليد", phone: "0155 888 9999", type: "RESTAURANT", status: "APPROVED", online: true, rating: 4.4, deliveries: 210, area: "المعادي", vehicle: "موتوسيكل", distanceKm: 0.8 },
  { id: "d5", name: "يوسف عماد", phone: "0100 010 2030", type: "TALABAT_BETAK", status: "PENDING", online: false, rating: 0, deliveries: 0, area: "الهرم", vehicle: "موتوسيكل", distanceKm: 7.4 },
  { id: "d6", name: "طارق سمير", phone: "0111 121 3141", type: "TALABAT_BETAK", status: "SUSPENDED", online: false, rating: 3.1, deliveries: 320, area: "شبرا", vehicle: "موتوسيكل", distanceKm: 9.9 },
];

/* -------------------------------- Money ---------------------------------- */

export type WalletTx = {
  id: string;
  title: string;
  ref: string;
  amount: number;
  type: "credit" | "debit";
  at: string;
};

export const customerWallet = {
  balance: 340,
  transactions: [
    { id: "w1", title: "استرداد طلب ملغي", ref: "#12342", amount: 105, type: "credit", at: "أمس 18:40" },
    { id: "w2", title: "دفع طلب", ref: "#12343", amount: 350, type: "debit", at: "أمس 21:44" },
    { id: "w3", title: "شحن محفظة", ref: "Paymob", amount: 500, type: "credit", at: "الإثنين 10:12" },
    { id: "w4", title: "دفع طلب", ref: "#12339", amount: 215, type: "debit", at: "الأحد 20:02" },
  ] as WalletTx[],
};

export const driverWallet = {
  balance: 1265,
  today: 320,
  week: 2140,
  commissionRate: 70,
  transactions: [
    { id: "dw1", title: "أرباح توصيل", ref: "#12343", amount: 21, type: "credit", at: "أمس 22:10" },
    { id: "dw2", title: "أرباح توصيل", ref: "#12341", amount: 35, type: "credit", at: "أمس 19:30" },
    { id: "dw3", title: "تحصيل نقدي مستحق للمنصة", ref: "#12338", amount: 180, type: "debit", at: "أمس 16:05" },
    { id: "dw4", title: "تسوية أسبوعية", ref: "SET-0091", amount: 1400, type: "debit", at: "السبت 12:00" },
  ] as WalletTx[],
};

export type Settlement = {
  id: string;
  party: string;
  period: string;
  orders: number;
  gross: number;
  commission: number;
  delivery: number;
  adjustments: number;
  refunds: number;
  net: number;
  status: "PENDING" | "APPROVED" | "PAID";
};

export const settlements: Settlement[] = [
  { id: "SET-0104", party: "برجر هاوس", period: "10 — 16 أغسطس", orders: 412, gross: 168400, commission: 25260, delivery: 8240, adjustments: -500, refunds: 1250, net: 141890, status: "PENDING" },
  { id: "SET-0103", party: "بيتزا روما", period: "10 — 16 أغسطس", orders: 208, gross: 74300, commission: 8916, delivery: 5200, adjustments: 0, refunds: 320, net: 65064, status: "APPROVED" },
  { id: "SET-0102", party: "كشري التحرير", period: "3 — 9 أغسطس", orders: 690, gross: 51200, commission: 5120, delivery: 10350, adjustments: 200, refunds: 0, net: 46280, status: "PAID" },
  { id: "SET-0101", party: "محطة المشويات", period: "3 — 9 أغسطس", orders: 122, gross: 62400, commission: 11232, delivery: 3660, adjustments: 0, refunds: 640, net: 50528, status: "PAID" },
];

export type PricingTier = {
  id: string;
  from: number;
  to: number;
  price: number;
  active: boolean;
};

export const pricingTiers: PricingTier[] = [
  { id: "t1", from: 0, to: 5, price: 20, active: true },
  { id: "t2", from: 5, to: 10, price: 30, active: true },
  { id: "t3", from: 10, to: 15, price: 45, active: true },
  { id: "t4", from: 15, to: 20, price: 60, active: false },
];

export type RefundRequest = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  reason: string;
  method: "WALLET" | "CARD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  at: string;
};

export const refunds: RefundRequest[] = [
  { id: "RF-201", order: "#12342", customer: "نورهان سمير", amount: 105, reason: "الطلب اتلغى بعد الدفع", method: "CARD", status: "PENDING", at: "أمس 18:35" },
  { id: "RF-200", order: "#12330", customer: "محمد خالد", amount: 60, reason: "صنف ناقص", method: "WALLET", status: "APPROVED", at: "الإثنين 13:20" },
  { id: "RF-199", order: "#12318", customer: "سارة علي", amount: 240, reason: "طلب وصل بارد", method: "CARD", status: "REJECTED", at: "الأحد 22:15" },
];

/* -------------------------------- Content --------------------------------- */

export type Review = {
  id: string;
  customer: string;
  target: string;
  targetType: "مطعم" | "منتج" | "مندوب" | "طلب";
  rating: number;
  text: string;
  at: string;
  reply?: string;
  hidden?: boolean;
};

export const reviews: Review[] = [
  { id: "rv1", customer: "أحمد محمود", target: "برجر هاوس", targetType: "مطعم", rating: 5, text: "أحسن برجر في المعادي، التوصيل كان سريع جداً.", at: "اليوم 15:40", reply: "شكراً ليك يا أحمد! 🙏" },
  { id: "rv2", customer: "سارة علي", target: "بيتزا مارجريتا", targetType: "منتج", rating: 4, text: "طعم ممتاز بس العجينة كانت رفيعة شوية.", at: "أمس 20:10" },
  { id: "rv3", customer: "محمد خالد", target: "محمود سعيد", targetType: "مندوب", rating: 5, text: "مندوب محترم وملتزم بالمواعيد.", at: "أمس 22:05" },
  { id: "rv4", customer: "نورهان سمير", target: "طلب #12342", targetType: "طلب", rating: 2, text: "الطلب اتأخر كتير قبل ما يتلغي.", at: "أمس 19:00", hidden: true },
];

export type Offer = {
  id: string;
  title: string;
  type: "نسبة خصم" | "خصم ثابت" | "منتج مجاني";
  value: string;
  scope: string;
  from: string;
  to: string;
  active: boolean;
  used: number;
};

export const offers: Offer[] = [
  { id: "of1", title: "خصم 20% على أول طلب", type: "نسبة خصم", value: "20%", scope: "كل المنتجات", from: "1 أغسطس", to: "31 أغسطس", active: true, used: 412 },
  { id: "of2", title: "برجر دوبل بـ 149", type: "خصم ثابت", value: "56 ج.م", scope: "برجر كلاسيك", from: "10 أغسطس", to: "20 أغسطس", active: true, used: 96 },
  { id: "of3", title: "مشروب مجاني فوق 200 ج.م", type: "منتج مجاني", value: "بيبسي", scope: "الطلبات فوق 200", from: "1 يوليو", to: "31 يوليو", active: false, used: 780 },
];

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  icon: string;
  at: string;
  unread: boolean;
};

export const notifications: NotificationItem[] = [
  { id: "n1", title: "مندوبك في الطريق", body: "محمود سعيد استلم طلبك #12345 وهيوصلك خلال 12 دقيقة.", icon: "two_wheeler", at: "منذ دقيقتين", unread: true },
  { id: "n2", title: "تم تأكيد الطلب", body: "برجر هاوس أكد طلبك وبدأ التحضير.", icon: "restaurant", at: "منذ 20 دقيقة", unread: true },
  { id: "n3", title: "تم استرداد المبلغ", body: "تم إضافة 105 ج.م لمحفظتك عن الطلب #12342.", icon: "account_balance_wallet", at: "أمس", unread: false },
  { id: "n4", title: "عرض جديد", body: "خصم 20% من كشري التحرير النهاردة بس.", icon: "local_offer", at: "أمس", unread: false },
];

/* -------------------------------- Analytics -------------------------------- */

export const restaurantStats = {
  revenue: 168400,
  orders: 412,
  aov: 409,
  cancelled: 12,
  repeatRate: 38,
  newCustomers: 96,
  commission: 25260,
  net: 141890,
  series: [42, 55, 48, 71, 66, 83, 92],
  days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
  best: [
    { name: "برجر كلاسيك", orders: 182, revenue: 37310 },
    { name: "تشيكن كرانشي", orders: 141, revenue: 16215 },
    { name: "بطاطس شيدر", orders: 120, revenue: 6000 },
  ],
  worst: [
    { name: "سلطة سيزر", orders: 6, revenue: 480 },
    { name: "شوربة عدس", orders: 9, revenue: 405 },
  ],
  branchPerf: [
    { name: "فرع المعادي", orders: 212, revenue: 92400, rating: 4.8 },
    { name: "فرع مدينة نصر", orders: 141, revenue: 54200, rating: 4.6 },
    { name: "فرع الدقي", orders: 59, revenue: 21800, rating: 4.3 },
  ],
};

export const platformStats = {
  gmv: 4210000,
  revenue: 512400,
  orders: 12840,
  customers: 8420,
  restaurants: 186,
  activeDrivers: 214,
  growth: 18.4,
  series: [220, 260, 310, 290, 380, 420, 470, 510, 560, 610, 680, 740],
  months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  topRestaurants: [
    { name: "برجر هاوس", orders: 1420, gmv: 512000 },
    { name: "كشري التحرير", orders: 2210, gmv: 184000 },
    { name: "بيتزا روما", orders: 980, gmv: 312000 },
  ],
  topAreas: [
    { name: "المعادي", orders: 3120, share: 24 },
    { name: "مدينة نصر", orders: 2410, share: 19 },
    { name: "مصر الجديدة", orders: 1840, share: 14 },
    { name: "الدقي", orders: 1120, share: 9 },
  ],
};

export type AdminRole = {
  id: string;
  name: string;
  members: number;
  permissions: string[];
};

export const adminRoles: AdminRole[] = [
  { id: "super", name: "سوبر أدمن", members: 2, permissions: ["كل الصلاحيات"] },
  { id: "ops", name: "مدير تشغيل", members: 5, permissions: ["الطلبات", "المندوبين", "التجار"] },
  { id: "fin", name: "مالية", members: 3, permissions: ["التسويات", "الاستردادات", "التقارير"] },
  { id: "support", name: "دعم العملاء", members: 11, permissions: ["الطلبات", "التقييمات"] },
];

export const allPermissions = [
  "لوحة التحكم",
  "الطلبات",
  "التجار",
  "المندوبين",
  "العملاء",
  "المالية",
  "الاستردادات",
  "التسويات",
  "التسعير",
  "العمولات",
  "التقييمات",
  "الإشعارات",
  "التقارير",
  "المستخدمين والصلاحيات",
];

/* ------------------------- Governance & operations ------------------------- */

export type AuditLog = {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  at: string;
  change: string;
  severity: "عادي" | "حساس";
};

export const auditLogs: AuditLog[] = [
  { id: "AL-9012", actor: "هاني عبد الله", role: "سوبر أدمن", action: "تغيير عمولة مطعم", entity: "برجر هاوس", at: "اليوم 14:22", change: "15% ← 12%", severity: "حساس" },
  { id: "AL-9011", actor: "منى رشدي", role: "مالية", action: "الموافقة على استرداد", entity: "RF-200", at: "اليوم 13:20", change: "PENDING ← APPROVED", severity: "حساس" },
  { id: "AL-9010", actor: "هاني عبد الله", role: "سوبر أدمن", action: "إنشاء أدمن", entity: "سيف الدين محمد", at: "أمس 18:02", change: "دور: مدير تشغيل", severity: "حساس" },
  { id: "AL-9009", actor: "أحمد فؤاد", role: "مدير تشغيل", action: "إيقاف مندوب", entity: "طارق سمير", at: "أمس 16:40", change: "APPROVED ← SUSPENDED", severity: "حساس" },
  { id: "AL-9008", actor: "أحمد فؤاد", role: "مدير تشغيل", action: "توثيق مطعم", entity: "بيتزا روما", at: "أمس 11:15", change: "UNDER_REVIEW ← APPROVED", severity: "عادي" },
  { id: "AL-9007", actor: "منى رشدي", role: "مالية", action: "تعديل شريحة تسعير", entity: "0 — 5 كم", at: "الإثنين 10:05", change: "18 ← 20 ج.م", severity: "حساس" },
  { id: "AL-9006", actor: "نظام", role: "نظام", action: "تعديل محفظة", entity: "محفظة عميل #8342", at: "الإثنين 09:30", change: "+105 ج.م (استرداد)", severity: "عادي" },
  { id: "AL-9005", actor: "هاني عبد الله", role: "سوبر أدمن", action: "تعديل تسوية", entity: "SET-0102", at: "الأحد 20:00", change: "APPROVED ← PAID", severity: "حساس" },
];

export type Payment = {
  id: string;
  order: string;
  customer: string;
  method: "CASH" | "CARD" | "WALLET";
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIAL_REFUND";
  at: string;
  ref: string;
};

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "معلّق",
  PROCESSING: "قيد التنفيذ",
  SUCCESS: "ناجح",
  FAILED: "فاشل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
  PARTIAL_REFUND: "استرداد جزئي",
};

export const methodLabels: Record<string, string> = { CASH: "نقدي", CARD: "فيزا / Paymob", WALLET: "محفظة" };

export const payments: Payment[] = [
  { id: "PM-4410", order: "#12345", customer: "أحمد محمود", method: "CARD", amount: 512, status: "SUCCESS", at: "اليوم 15:02", ref: "pmb_8f21a" },
  { id: "PM-4409", order: "#12344", customer: "سارة علي", method: "CASH", amount: 268, status: "PENDING", at: "اليوم 14:40", ref: "—" },
  { id: "PM-4408", order: "#12343", customer: "محمد خالد", method: "CARD", amount: 350, status: "PROCESSING", at: "اليوم 14:10", ref: "pmb_7c09b" },
  { id: "PM-4407", order: "#12342", customer: "نورهان سمير", method: "CARD", amount: 105, status: "REFUNDED", at: "أمس 18:35", ref: "pmb_6a55c" },
  { id: "PM-4406", order: "#12341", customer: "يوسف رأفت", method: "WALLET", amount: 189, status: "SUCCESS", at: "أمس 17:20", ref: "wlt_1120" },
  { id: "PM-4405", order: "#12340", customer: "هبة ماهر", method: "CARD", amount: 430, status: "FAILED", at: "أمس 16:02", ref: "pmb_5f13d" },
  { id: "PM-4404", order: "#12339", customer: "كريم سامي", method: "CARD", amount: 215, status: "PARTIAL_REFUND", at: "الأحد 20:02", ref: "pmb_4b88e" },
  { id: "PM-4403", order: "#12338", customer: "مي عادل", method: "CASH", amount: 180, status: "CANCELLED", at: "الأحد 19:15", ref: "—" },
];

export type NotifTemplate = {
  id: string;
  event: string;
  title: string;
  body: string;
  channels: string;
  active: boolean;
  sent: number;
  failed: number;
};

export const notifTemplates: NotifTemplate[] = [
  { id: "nt1", event: "تم إنشاء الطلب", title: "استلمنا طلبك", body: "طلبك {order} وصل للمطعم وجاري التأكيد.", channels: "Push", active: true, sent: 12840, failed: 41 },
  { id: "nt2", event: "تعيين مندوب", title: "مندوبك في الطريق", body: "{driver} استلم طلبك {order}.", channels: "Push", active: true, sent: 11920, failed: 63 },
  { id: "nt3", event: "تم التوصيل", title: "بالهنا والشفا 🎉", body: "تم توصيل طلبك {order}. قيّم تجربتك.", channels: "Push", active: true, sent: 11210, failed: 22 },
  { id: "nt4", event: "استرداد مبلغ", title: "تم الاسترداد", body: "تم إضافة {amount} لمحفظتك.", channels: "Push", active: true, sent: 640, failed: 3 },
  { id: "nt5", event: "عرض جديد", title: "عرض جديد قريب منك", body: "{restaurant} عنده عرض النهاردة.", channels: "Push", active: false, sent: 4210, failed: 118 },
];

export const notifDevices = [
  { id: "dv1", user: "أحمد محمود", platform: "Android", token: "fcm_a91…3f2", lastSeen: "منذ 5 دقائق", active: true },
  { id: "dv2", user: "أحمد محمود", platform: "iOS", token: "apns_7b2…d90", lastSeen: "أمس", active: true },
  { id: "dv3", user: "سارة علي", platform: "Android", token: "fcm_1c8…a44", lastSeen: "منذ ساعة", active: true },
  { id: "dv4", user: "محمود سعيد (مندوب)", platform: "Android", token: "fcm_5d0…b71", lastSeen: "منذ دقيقة", active: true },
  { id: "dv5", user: "هبة ماهر", platform: "iOS", token: "apns_9e4…c15", lastSeen: "منذ 12 يوم", active: false },
];

export type DriverCommissionRule = {
  id: string;
  name: string;
  scope: string;
  driverShare: number;
  platformShare: number;
  bonus: string;
  active: boolean;
};

export const driverCommissionRules: DriverCommissionRule[] = [
  { id: "dc1", name: "القاعدة الافتراضية", scope: "كل المندوبين", driverShare: 70, platformShare: 30, bonus: "—", active: true },
  { id: "dc2", name: "ساعات الذروة", scope: "6 م — 11 م", driverShare: 80, platformShare: 20, bonus: "+5 ج.م / طلب", active: true },
  { id: "dc3", name: "مناطق بعيدة", scope: "أكثر من 10 كم", driverShare: 75, platformShare: 25, bonus: "+10 ج.م / طلب", active: false },
];

export const retentionPolicies = [
  { id: "rp1", data: "السجلات المالية والتسويات", period: "10 سنوات", action: "حفظ دائم — لا يُحذف", locked: true },
  { id: "rp2", data: "سجلات التدقيق (Audit)", period: "7 سنوات", action: "حفظ دائم — لا يُحذف", locked: true },
  { id: "rp3", data: "سجلات أكواد OTP", period: "90 يوم", action: "حذف تلقائي", locked: false },
  { id: "rp4", data: "مواقع المندوبين اللحظية", period: "30 يوم", action: "حذف تلقائي", locked: false },
  { id: "rp5", data: "حسابات العملاء غير النشطة", period: "24 شهر", action: "إخفاء هوية (Anonymize)", locked: false },
  { id: "rp6", data: "مستندات المندوبين المرفوضة", period: "12 شهر", action: "حذف بعد موافقة المالك", locked: false },
];

export const securityChecks = [
  { id: "sc1", label: "التحقق بخطوتين للأدمن", state: "مُفعّل", icon: "verified_user", tone: "success" },
  { id: "sc2", label: "تحديد معدل الطلبات (Rate limiting)", state: "مُفعّل", icon: "speed", tone: "success" },
  { id: "sc3", label: "التحقق من المدخلات وحماية XSS / SQLi", state: "مُفعّل", icon: "shield", tone: "success" },
  { id: "sc4", label: "حماية CSRF على النماذج", state: "مُفعّل", icon: "lock", tone: "success" },
  { id: "sc5", label: "ترويسات أمان (Secure headers)", state: "مُفعّل", icon: "http", tone: "success" },
  { id: "sc6", label: "رفع ملفات آمن ومسح المرفقات", state: "مُفعّل", icon: "upload_file", tone: "success" },
  { id: "sc7", label: "تشفير البيانات أثناء النقل (TLS)", state: "مُفعّل", icon: "https", tone: "success" },
  { id: "sc8", label: "إدارة الأسرار والمفاتيح", state: "مُراجعة دورية", icon: "key", tone: "warn" },
];

export const monitors = [
  { id: "m1", label: "فشل إرسال OTP", value: "0.4%", detail: "12 من 3120 محاولة", tone: "success" },
  { id: "m2", label: "فشل المدفوعات", value: "1.2%", detail: "18 عملية / 24 ساعة", tone: "warn" },
  { id: "m3", label: "فشل تعيين مندوب", value: "0.8%", detail: "9 طلبات / 24 ساعة", tone: "warn" },
  { id: "m4", label: "فشل الإشعارات", value: "0.6%", detail: "247 توكن غير صالح", tone: "success" },
  { id: "m5", label: "أخطاء الـ API", value: "0.2%", detail: "متوسط الاستجابة 180ms", tone: "success" },
  { id: "m6", label: "أخطاء قاعدة البيانات", value: "0", detail: "آخر 24 ساعة", tone: "success" },
];

export const reportPresets = [
  { id: "r1", name: "تقرير الطلبات الشهري", desc: "كل الطلبات مع الحالة والقيمة والعمولة", icon: "receipt_long" },
  { id: "r2", name: "تقرير GMV والإيرادات", desc: "إجمالي المبيعات وإيراد المنصة لكل فترة", icon: "trending_up" },
  { id: "r3", name: "تقرير المطاعم", desc: "أداء كل مطعم: طلبات، مبيعات، تقييم", icon: "storefront" },
  { id: "r4", name: "تقرير المندوبين", desc: "التوصيلات، الأرباح، العمولة، التقييم", icon: "two_wheeler" },
  { id: "r5", name: "تقرير التسويات", desc: "التسويات الأسبوعية والمبالغ المستحقة", icon: "account_balance" },
  { id: "r6", name: "تقرير الاستردادات", desc: "طلبات الاسترداد وقرارات الإدارة", icon: "currency_exchange" },
];
