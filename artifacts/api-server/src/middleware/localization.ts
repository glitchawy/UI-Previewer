import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * API languages are deliberately limited to the two languages supported by the
 * clients.  Arabic is the fallback so adding an unrelated browser language
 * cannot make a response unexpectedly change.
 */
export type ApiLocale = "ar" | "en";

declare global {
  namespace Express {
    interface Request {
      locale: ApiLocale;
    }
  }
}

/**
 * This is a catalog of server-authored copy, rather than a general purpose
 * translator.  In particular, values read from the database (names,
 * addresses, notes, audit reasons, and notification copy composed by an
 * administrator) are not translated unless they exactly match one of these
 * curated templates.
 */
export const ARABIC_TO_ENGLISH: Readonly<Record<string, string>> = {
  "غير مصرح": "Unauthorized",
  "غير مصرح — سجّل دخولك مجدداً": "Unauthorized — please sign in again",
  "الجلسة غير صالحة": "Invalid session",
  "الجلسة غير صالحة — سجّل دخولك مجدداً": "Invalid session — please sign in again",
  "جلسة غير صالحة": "Invalid session",
  "الجلسة منتهية": "Session expired",
  "ليس لديك صلاحية لتنفيذ هذه العملية": "You do not have permission to perform this action",
  "ليس لديك الصلاحية المطلوبة": "You do not have the required permission",
  "هذه العملية متاحة للإدارة فقط": "This action is available to administrators only",
  "حساب الإدارة غير نشط": "The administrator account is inactive",
  "حساب الأدمن غير موجود": "Administrator account not found",
  "لا يمكن تعديل حساب السوبر أدمن": "The super administrator account cannot be modified",
  "لا يمكنك إيقاف حسابك الحالي": "You cannot deactivate your current account",
  "المسار غير متاح": "Route is not available",
  "المسار غير موجود": "Route not found",
  "بيانات الطلب غير صحيحة": "Invalid request data",
  "بيانات الصفحة غير صحيحة": "Invalid page data",
  "بيانات المخزون غير صحيحة": "Invalid inventory data",
  "بيانات الملف غير صحيحة": "Invalid profile data",
  "بيانات غير صحيحة": "Invalid data",
  "صفحات غير صحيحة": "Invalid pagination",
  "معرّف غير صحيح": "Invalid ID",
  "رقم الطلب غير صحيح": "Invalid order number",
  "رقم العميل غير صحيح": "Invalid customer number",
  "رقم الموبايل غير صحيح": "Invalid mobile number",
  "رقم جلسة الدفع غير صحيح": "Invalid payment session number",
  "الاسم يجب أن يتكون من حرفين إلى 80 حرفاً": "Name must be between 2 and 80 characters",
  "رقم الموبايل غير صحيح — يجب أن يكون رقماً مصرياً (01XXXXXXXXX)": "Invalid mobile number — use an Egyptian number (01XXXXXXXXX)",
  "الرقم ده مش مسجل — سجّل حساب جديد أولاً": "This number is not registered — create an account first",
  "الحساب ده مش موجود — سجّل حساب جديد": "This account does not exist — create an account",
  "الرقم ده مسجل بالفعل — سجّل دخول بدل كده": "This number is already registered — sign in instead",
  "لا يمكن إنشاء حساب مشرف من هنا": "An administrator account cannot be created here",
  "محاولات كتير غلط — اطلب كود جديد": "Too many incorrect attempts — request a new code",
  "الكود انتهت صلاحيته — اطلب كود جديد": "The code has expired — request a new code",
  "اطلب كود جديد أولاً": "Request a new code first",
  "الكود غير صحيح، حاول تاني": "Incorrect code, please try again",
  "تم إرسال كود التحقق عبر واتساب": "The verification code was sent via WhatsApp",
  "تم تجاوز الحد المسموح — حاول بعد دقيقتين": "The limit was exceeded — try again in two minutes",
  "تعذر إرسال الكود عبر واتساب ولم يتم ربط تيليجرام — أرسل الكود لأول مرة باستخدام واتساب أولاً": "The code could not be sent by WhatsApp and Telegram is not linked — send the code through WhatsApp first",
  "الخدمة غير متاحة مؤقتاً — يرجى المحاولة لاحقاً": "The service is temporarily unavailable — please try again later",
  "تعذر إرسال كود التحقق عبر واتساب — حاول لاحقاً": "The verification code could not be sent by WhatsApp — try again later",
  "حساب الاختبار غير جاهز — أعد تشغيل الخادم": "The test account is not ready — restart the server",
  "دور اختبار غير صحيح": "Invalid test role",
  "أرسلنا طلبك": "Your request was sent",
  "عميل": "Customer",
  "صاحب مطعم": "Restaurant owner",
  "مندوب": "Driver",
  "مشرف": "Administrator",
  "مشرف المنصة": "Platform administrator",
  "مفتاح مجموعة الصلاحيات مستخدم بالفعل": "Permission group key is already in use",
  "اسم المجموعة أو الصلاحيات أو سبب الإنشاء غير صحيح": "Group name, permissions, or creation reason is invalid",
  "بيانات مجموعة الصلاحيات غير صحيحة": "Invalid permission group data",
  "مجموعة الصلاحيات غير موجودة": "Permission group not found",
  "بيانات حساب الأدمن غير صحيحة": "Invalid administrator account data",
  "الهاتف أو البريد مستخدم بالفعل": "Phone or email is already in use",
  "أنت غير مضاف لأي فرع": "You are not assigned to a branch",
  "لا تملك صلاحية الوصول لهذا الفرع": "You do not have access to this branch",
  "بيانات الصفحات غير صحيحة": "Invalid pagination data",
  "الفرع غير موجود": "Branch not found",
  "الفرع المحدد غير موجود": "The selected branch was not found",
  "الفرع أو المنتج لا يخص مطعمك": "The branch or product does not belong to your restaurant",
  "اسم الفرع مطلوب": "Branch name is required",
  "عنوان الفرع مطلوب": "Branch address is required",
  "رقم الهاتف مطلوب": "Phone number is required",
  "لم يتم العثور على مطعمك": "Your restaurant was not found",
  "لم يتم العثور على مستخدم بهذا الرقم": "No user was found with this number",
  "الموظف غير موجود": "Staff member not found",
  "الموظف غير موجود أو غير نشط": "Staff member not found or inactive",
  "الموظف غير موجود في هذا الفرع": "Staff member is not in this branch",
  "هذا الموظف مضاف بالفعل لهذا الفرع": "This staff member is already assigned to this branch",
  "الموظف في هذا الفرع بالفعل": "Staff member is already in this branch",
  "الدور غير صالح — الخيارات: MANAGER, STAFF, CASHIER": "Invalid role — options: MANAGER, STAFF, CASHIER",
  "برجاء تحديد الفرع المراد النقل إليه": "Please select the branch to move to",
  "لا يمكن حذف فرع به موظفون نشطون — أزل الموظفين أولاً": "A branch with active staff cannot be deleted — remove the staff first",
  "دخول موظفي الفروع غير مدعوم في نموذج الصلاحيات الحالي": "Branch-staff login is not supported by the current permission model",
  "إدارة حسابات موظفي الفروع غير متاحة حتى يتوفر دور فرعي آمن": "Branch-staff account management is unavailable until a safe sub-role exists",
  "غير موجود": "Not found",
  "لم يتم العثور على الطلب": "Application not found",
  "لم يتم العثور على طلب مسجّل": "Registered application not found",
  "يوجد طلب مسجّل بالفعل — لا يمكن تقديم طلب جديد": "An application already exists — a new application cannot be submitted",
  "لم يتم إرسال أي تحديثات": "No updates were sent",
  "لا يمكن تعديل المستندات في الحالة الحالية": "Documents cannot be changed in the current state",
  "سبب الرفض مطلوب": "A rejection reason is required",
  "بيانات الإسناد وسبب العملية مطلوبة": "Assignment data and an operation reason are required",
  "تعذر تحديد فرع الشريك تلقائياً؛ يجب حل تعارض الفروع قبل الموافقة": "The partner branch could not be selected automatically; resolve the branch conflict before approval",
  "تم تعديل الطلب بواسطة مشرف آخر، حدّث الصفحة": "The application was changed by another administrator; refresh the page",
  "انتقال الحالة غير مسموح": "This status transition is not allowed",
  "تم قبول طلبك": "Your application was approved",
  "تم رفض طلبك": "Your application was rejected",
  "تهانينا، تمت الموافقة على طلب الانضمام.": "Congratulations, your application was approved.",
  "تم رفض طلب الانضمام": "Your application was rejected",
  "الإشعار غير موجود": "Notification not found",
  "بيانات الإشعار غير صحيحة": "Invalid notification data",
  "حالة الإشعار غير صحيحة": "Invalid notification status",
  "حدث الإشعار غير موجود": "Notification event not found",
  "رقم الحدث غير صحيح": "Invalid event number",
  "لا يمكن إلغاء إشعار تم تسليمه": "A delivered notification cannot be cancelled",
  "تم تسليم الإشعار": "The notification was delivered",
  "تم إسناد توصيلة": "A delivery was assigned",
  "تم إسناد الطلب بالفعل": "The order has already been assigned",
  "الإسناد متاح للطلبات الجاهزة فقط": "Assignment is available only for ready orders",
  "الطلب غير موجود": "Order not found",
  "الطلب غير موجود أو غير متاح": "Order not found or unavailable",
  "العميل غير موجود": "Customer not found",
  "الكابتن غير مؤهل أو لديه توصيلة نشطة": "The driver is not eligible or has an active delivery",
  "حالة الطلب غير صحيحة": "Invalid order status",
  "طريقة الدفع غير صحيحة": "Invalid payment method",
  "حالة الدفع غير صحيحة": "Invalid payment status",
  "الطلب لا يخص فرعك": "The order does not belong to your branch",
  "تعذر الوصول إلى هذا الطلب": "This order cannot be accessed",
  "الطلب جاهز للاستلام": "The order is ready for pickup",
  "الطلب جاهز": "The order is ready",
  "استلم الكابتن الطلب": "The driver picked up the order",
  "تم استلام الطلب": "Order received",
  "تم تأكيد الطلب": "Order confirmed",
  "تم تأكيد طلبك": "Your order was confirmed",
  "جاري تحضير الطلب": "The order is being prepared",
  "تم توصيل الطلب": "Order delivered",
  "تم إلغاء الطلب": "Order cancelled",
  "طلبك قيد التحضير": "Your order is being prepared",
  "طلبك جاهز": "Your order is ready",
  "طلبك جاهز للاستلام والتوصيل": "Your order is ready for pickup and delivery",
  "لا يمكن نقل الطلب لهذه المرحلة الآن": "The order cannot move to this stage now",
  "لا يمكن تجهيز طلب أونلاين قبل تأكيد الدفع": "An online order cannot be prepared before payment is confirmed",
  "لا يوجد تكليف فرع نشط لتنفيذ الطلبات": "There is no active branch assignment for fulfilling orders",
  "لم يعد لديك تكليف نشط لهذا الفرع": "You no longer have an active assignment for this branch",
  "بيانات تحديث الطلب غير صحيحة": "Invalid order update data",
  "بيانات التصفية أو الصفحات غير صحيحة": "Invalid filter or pagination data",
  "اسم المطعم غير صحيح": "Invalid restaurant name",
  "وصف المطعم غير صحيح": "Invalid restaurant description",
  "رقم الهاتف غير صحيح": "Invalid phone number",
  "البريد الإلكتروني غير صحيح": "Invalid email",
  "العنوان غير صحيح": "Invalid address",
  "الموقع يجب أن يكون داخل مصر": "The location must be in Egypt",
  "التصنيف غير صحيح": "Invalid category",
  "رابط الشعار غير صحيح": "Invalid logo URL",
  "رابط الغلاف غير صحيح": "Invalid cover URL",
  "لا توجد حقول للتعديل": "There are no fields to update",
  "المطعم غير موجود": "Restaurant not found",
  "المطعم غير موجود أو غير نشط": "Restaurant not found or inactive",
  "المنتج غير موجود": "Product not found",
  "المنتج غير متاح": "Product unavailable",
  "القسم غير موجود": "Category not found",
  "اسم القسم مطلوب": "Category name is required",
  "اسم المنتج مطلوب": "Product name is required",
  "الإضافة غير موجودة": "Add-on not found",
  "اسم الإضافة مطلوب": "Add-on name is required",
  "الحجم غير موجود": "Size not found",
  "اسم الحجم مطلوب": "Size name is required",
  "السعر غير صحيح": "Invalid price",
  "قيمة الإتاحة غير صحيحة": "Invalid availability value",
  "لا يمكن حذف قسم يحتوي على منتجات — انقل المنتجات أولاً": "A category containing products cannot be deleted — move the products first",
  "حدد عنوان التوصيل أولاً لاستخدام فلتر المسافة": "Add a delivery address first to use the distance filter",
  "نطاق المسافة يجب أن يكون بين 1 و100 كم": "Distance must be between 1 and 100 km",
  "نص البحث طويل جداً": "Search text is too long",
  "بيانات السلة غير صحيحة": "Invalid cart data",
  "كمية غير صحيحة": "Invalid quantity",
  "اختيار الحجم مطلوب": "A size selection is required",
  "الحجم المختار غير متاح لهذا المنتج": "The selected size is unavailable for this product",
  "إحدى الإضافات غير متاحة": "One of the add-ons is unavailable",
  "لا يمكن تعديل السلة أثناء تأكيد الدفع أونلاين.": "The cart cannot be changed while online payment is being confirmed.",
  "المطعم مغلق أو المنتج غير متاح حالياً. لم تتم إضافة العنصر.": "The restaurant is closed or the product is currently unavailable. The item was not added.",
  "أضف عنوان التوصيل أولاً": "Add a delivery address first",
  "السلة فارغة": "The cart is empty",
  "أحد عناصر السلة لم يعد متاحاً. راجع السلة وحاول مرة أخرى.": "An item in the cart is no longer available. Review the cart and try again.",
  "المطعم مغلق أو لا يستقبل الطلبات حالياً. احتفظنا بعناصر سلتك لتجرب مرة أخرى لاحقاً.": "The restaurant is closed or is not accepting orders. We kept the cart items so you can try again later.",
  "عنوانك خارج شرائح التوصيل النشطة حالياً": "Your address is outside the active delivery zones",
  "لديك عملية دفع أونلاين بانتظار التأكيد. أكملها أو انتظر انتهاءها قبل إنشاء طلب جديد.": "You have an online payment awaiting confirmation. Complete it or wait for it to expire before creating a new order.",
  "الدفع أونلاين غير متاح حالياً. اختر الدفع كاش أو استخدم رصيد المحفظة بالكامل.": "Online payment is currently unavailable. Choose cash or use your wallet balance in full.",
  "الدفع أونلاين غير مُجهز حالياً. اختر الدفع كاش أو حاول لاحقاً.": "Online payment is not configured yet. Choose cash or try again later.",
  "تعذر بدء جلسة الدفع أونلاين. لم يتم إنشاء الطلب، حاول مرة أخرى.": "The online payment session could not be started. The order was not created; try again.",
  "تعذر تأكيد رابط الدفع حالياً. احتفظنا بطلبك وسلتك بأمان؛ أعد المحاولة بعد دقيقتين.": "The payment link could not be confirmed. Your order and cart are safe; try again in two minutes.",
  "تعذر تأكيد رابط الدفع حالياً. احتفظنا بطلبك وسلتك بأمان؛ افتح طلباتك بعد لحظات للتحقق قبل إعادة المحاولة.": "The payment link could not be confirmed. Your order and cart are safe; open your orders shortly to check before trying again.",
  "انتهت جلسة الدفع. يمكنك إعادة المحاولة من السلة.": "The payment session expired. You can try again from the cart.",
  "يتم تجهيز رابط الدفع بأمان. لا تنشئ عملية دفع جديدة؛ افتح طلباتك بعد لحظات للتحقق.": "The payment link is being prepared securely. Do not create another payment; open your orders shortly to check.",
  "نؤكد حالة الدفع مع المزود الآن. لا تنشئ عملية دفع جديدة؛ افتح طلباتك أو انتظر انتهاء الجلسة.": "We are confirming payment status with the provider. Do not create another payment; open your orders or wait for the session to expire.",
  "رفض مزود الدفع إنشاء الجلسة. ألغينا الطلب المؤقت وأعدنا فتح السلة للمحاولة.": "The payment provider rejected session creation. We cancelled the temporary order and reopened the cart.",
  "تم إلغاء الطلب بالفعل": "The order has already been cancelled",
  "لا يمكن إلغاء الطلب بعد بدء التحضير": "The order cannot be cancelled after preparation has started",
  "اختر سبباً صحيحاً لطلب الاسترداد": "Choose a valid reason for the refund request",
  "يمكن طلب الاسترداد بعد توصيل الطلب فقط": "A refund can be requested only after delivery",
  "تم استرداد هذا الطلب بالفعل": "This order has already been refunded",
  "تم إرسال طلب استرداد لهذا الطلب من قبل": "A refund request for this order has already been submitted",
  "تم إلغاء الطلب وإعادة أي رصيد مستخدم للمحفظة": "The order was cancelled and any wallet balance used was returned",
  "تم إلغاء الطلب واسترداد البطاقة قيد المراجعة": "The order was cancelled and the card refund is under review",
  "تم إلغاء الطلب وبدء استرداد مبلغ البطاقة": "The order was cancelled and the card refund was started",
  "تم إلغاء الطلب وتعذر تنفيذ استرداد البطاقة تلقائياً؛ فريق الإدارة سيتابع المبلغ": "The order was cancelled but the card refund could not be completed automatically; the administration team will follow up",
  "تم إلغاء الطلب ونراجع تأكيد استرداد البطاقة قبل أي محاولة أخرى": "The order was cancelled; we are checking the card refund before another attempt",
  "تم إلغاء طلبات جلسة الدفع وإعادة رصيد المحفظة المستخدم": "Payment-session orders were cancelled and the wallet balance used was returned",
  "تمت الإعادة تلقائياً": "The amount was returned automatically",
  "تعذر تأكيد بيانات الدفع بأمان. تواصل مع الدعم قبل إعادة المحاولة.": "Payment details could not be confirmed safely. Contact support before trying again.",
  "إلغاء الطلب قبل بدء التحضير": "Order cancellation before preparation started",
  "إعادة رصيد المحفظة بعد إلغاء الطلب": "Wallet balance returned after order cancellation",
  "إعادة رصيد المحفظة بعد إلغاء جلسة الدفع": "Wallet balance returned after payment-session cancellation",
  "جلسة الدفع غير موجودة": "Payment session not found",
  "الملف فارغ أو لم يُرسَل بشكل صحيح": "The file is empty or was not sent correctly",
  "حجم الملف كبير جداً — الحد الأقصى 10 ميجابايت": "The file is too large — the maximum is 10 MB",
  "نوع الملف غير مقبول — يُسمح فقط بالصور (JPG، PNG، WebP، GIF) أو ملفات PDF": "File type is not accepted — only images (JPG, PNG, WebP, GIF) or PDF files are allowed",
  "فشل رفع الملف، حاول مرة أخرى": "File upload failed, try again",
  "إحداثيات غير صالحة": "Invalid coordinates",
  "الموقع خارج نطاق التغطية — الخدمة متاحة داخل مصر فقط": "The location is outside the service area — service is available in Egypt only",
  "نص العنوان مطلوب": "Address text is required",
  "تعذر البحث عن العنوان — جرّب مرة أخرى": "The address could not be found — try again",
  "تعذر تحديد اسم العنوان — جرّب مرة أخرى": "The address name could not be determined — try again",
  "إحداثيات الموقع غير صحيحة": "Invalid location coordinates",
  "إحداثيات موقع الإسناد غير صحيحة أو خارج مصر": "Assignment-location coordinates are invalid or outside Egypt",
  "تحديث الموقع يتطلب اتصالاً وتوصيلة نشطة واحدة مسندة": "Location updates require an online connection and exactly one assigned active delivery",
  "تغيرت حالة الاتصال أو التوصيلة، حدّث الصفحة": "The connection or delivery changed; refresh the page",
  "تغيرت حالة الحساب، حدّث الصفحة": "The account changed; refresh the page",
  "الموافقة على الحساب مطلوبة قبل الاتصال": "Account approval is required before going online",
  "الحالة غير صحيحة": "Invalid state",
  "الجهاز غير موجود": "Device not found",
  "رقم الجهاز غير صحيح": "Invalid device number",
  "رمز الجهاز أو المنصة غير صحيح": "Invalid device token or platform",
  "رمز الجهاز مسجل لحساب آخر": "Device token is registered to another account",
  "حساب الكابتن غير موجود": "Driver account not found",
  "حساب الكابتن غير مفعل للتوصيل": "Driver account is not enabled for deliveries",
  "ملف الكابتن غير موجود": "Driver profile not found",
  "عرض التوصيل لم يعد متاحاً": "The delivery offer is no longer available",
  "العرض منتهي أو غير مخصص لك": "The offer has expired or is not assigned to you",
  "العرض منتهي أو تمت معالجته": "The offer has expired or was already processed",
  "تم قبول العرض بواسطة كابتن آخر": "The offer was accepted by another driver",
  "لديك توصيلة نشطة بالفعل": "You already have an active delivery",
  "الطلب غير مسند لهذا الكابتن": "The order is not assigned to this driver",
  "هذا التعيين غير نشط بالفعل": "This assignment is already inactive",
  "استلم المندوب طلبك وهو في طريقه إليك": "The driver picked up your order and is on the way",
  "تم توصيل طلبك": "Your order was delivered",
  "تم توصيل طلبك بنجاح، نتمنى لك وجبة شهية": "Your order was delivered successfully. Enjoy your meal",
  "طلبك في الطريق": "Your order is on the way",
  "التقييم من 1 إلى 5": "Rating must be from 1 to 5",
  "التقييم متاح لصاحب الطلب بعد التسليم فقط": "The order owner can review only after delivery",
  "تم تقييم الطلب من قبل": "This order has already been reviewed",
  "التقييم غير موجود أو غير متاح": "Review not found or unavailable",
  "الرد يجب أن يتكون من حرفين على الأقل": "The reply must contain at least two characters",
  "الفترة غير صحيحة": "Invalid period",
  "الفترة مطلوبة": "A period is required",
  "الفترة لا تتجاوز سنة": "The period cannot exceed one year",
  "الفترة أو المطعم أو السبب غير صحيح": "The period, restaurant, or reason is invalid",
  "الإعدادات أو الإصدار أو السبب غير صحيح": "The settings, version, or reason is invalid",
  "بيانات الشريحة غير صحيحة": "Invalid pricing-tier data",
  "بيانات القاعدة غير صحيحة": "Invalid rule data",
  "النسبة أو السبب غير صحيح": "The rate or reason is invalid",
  "التسوية موجودة لهذه الفترة": "A settlement already exists for this period",
  "قرار غير صحيح": "Invalid decision",
  "قرار المراجعة غير صحيح": "Invalid review decision",
  "تم تعديل الإعدادات، أعد التحميل": "The settings changed; reload the page",
  "تم اتخاذ قرار في طلب الاسترداد بالفعل": "A decision has already been made on this refund request",
  "طلب الاسترداد غير موجود": "Refund request not found",
  "عملية الاسترداد غير موجودة": "Refund operation not found",
  "اكتب سبب الرفض": "Enter a rejection reason",
  "المبلغ المؤكد يتجاوز قيمة العملية الأصلية": "The confirmed amount exceeds the original transaction",
  "بيانات التسوية غير صحيحة": "Invalid settlement data",
  "بيانات القرار غير صحيحة": "Invalid decision data",
  "تعذر حفظ نتيجة التسوية": "The settlement result could not be saved",
  "تمت الموافقة وإضافة المبلغ للمحفظة": "Approved and added the amount to the wallet",
  "هذه العملية لا تحتاج تسوية يدوية": "This operation does not need manual settlement",
  "هذه العملية متاحة للأدمن فقط": "This operation is available to administrators only",
  "طلب غير صحيح": "Invalid order",
  "طلبات بيتك": "Talabat Betak",
  "أعد المحاولة": "Try again",
  "المطعم غير نشط حالياً": "The restaurant is not active right now",
  "فروع المطعم مغلقة حالياً": "The restaurant branches are currently closed",
  "مواعيد المطعم غير متاحة حالياً": "The restaurant schedule is currently unavailable",
  "المطعم يستقبل الطلبات الآن": "The restaurant is accepting orders now",
  "المطعم مغلق حالياً": "The restaurant is currently closed",
  "المنتج غير متاح حالياً": "The product is currently unavailable",
  "عرض توصيل جديد": "New delivery offer",
  "تم استلام طلبك": "Your order was received",
  "المطعم أكد الطلب": "The restaurant confirmed the order",
  "الطلب خرج للتوصيل": "The order is out for delivery",
} as const;

/** Existing English infrastructure messages also need an Arabic response. */
export const ENGLISH_TO_ARABIC: Readonly<Record<string, string>> = {
  "Route not found": "المسار غير موجود",
  "Too many requests": "طلبات كثيرة جداً",
  "Origin is not allowed": "المصدر غير مسموح",
  "Request timed out": "انتهت مهلة الطلب",
  "Request body is too large": "حجم جسم الطلب كبير جداً",
  "Malformed JSON body": "جسم JSON غير صحيح",
  "Internal server error": "خطأ داخلي في الخادم",
  "Invalid request data": "بيانات الطلب غير صحيحة",
  "Invalid order data": "بيانات الطلب غير صحيحة",
  "Unauthorized": "غير مصرح",
  "invalid JSON": "JSON غير صحيح",
  "invalid signature": "توقيع غير صحيح",
  "unable to persist callback": "تعذر حفظ الاستدعاء",
  "File not found": "الملف غير موجود",
  "Access denied": "الوصول مرفوض",
};

const ROLE_LABELS: Readonly<Record<string, string>> = {
  "عميل": "Customer",
  "صاحب مطعم": "Restaurant owner",
  "مندوب": "Driver",
  "مشرف": "Administrator",
};

const DAY_NAMES: Readonly<Record<string, string>> = {
  "الأحد": "Sunday",
  "الإثنين": "Monday",
  "الثلاثاء": "Tuesday",
  "الأربعاء": "Wednesday",
  "الخميس": "Thursday",
  "الجمعة": "Friday",
  "السبت": "Saturday",
};

function translateDynamicArabic(value: string): string | undefined {
  let match = /^انتظر (.+?) ثانية قبل إعادة الإرسال$/.exec(value);
  if (match) return `Wait ${match[1]} seconds before resending`;

  match = /^الرقم ده مسجل بالفعل كـ(.+?) — أنشئ حساباً منفصلاً كـ(.+?)$/.exec(value);
  if (match) {
    const existing = ROLE_LABELS[match[1]] ?? match[1];
    const requested = ROLE_LABELS[match[2]] ?? match[2];
    return `This number is already registered as ${existing} — create a separate ${requested} account`;
  }

  // The suffix is an administrator/applicant supplied reason.  Keep it byte
  // for byte identical instead of attempting to translate arbitrary content.
  match = /^تم رفض طلب الانضمام: (.*)$/.exec(value);
  if (match) return `Your application was rejected: ${match[1]}`;

  match = /^تم إسناد الطلب (TB-\d{6}) إليك$/.exec(value);
  if (match) return `Order ${match[1]} was assigned to you`;

  match = /^استلمنا طلبك (TB-\d{6}) من (.*)$/.exec(value);
  if (match) return `We received your order ${match[1]} from ${match[2]}`;

  match = /^لديك عرض توصيل من (.*)$/.exec(value);
  if (match) return `You have a delivery offer from ${match[1]}`;

  match = /^أكد (.*) طلبك وبدأ العمل عليه$/.exec(value);
  if (match) return `${match[1]} confirmed your order and started preparing it`;

  match = /^(.*) يحضّر طلبك الآن$/.exec(value);
  if (match) return `${match[1]} is preparing your order now`;

  match = /^مواعيد (.*) غير صحيحة$/.exec(value);
  if (match) return `Invalid hours for ${match[1]}`;

  match = /^يفتح يومياً الساعة (.*)$/.exec(value);
  if (match) return `Opens daily at ${match[1]}`;

  match = /^يفتح (.*) الساعة (.*)$/.exec(value);
  if (match) return `Opens ${DAY_NAMES[match[1]] ?? match[1]} at ${match[2]}`;

  return undefined;
}

/**
 * Translate one curated server-authored value. Unknown values are returned
 * unchanged, which is important for user content and for forward-compatible
 * API fields.
 */
export function translateApiText(value: string, locale: ApiLocale): string {
  if (locale === "en") {
    const direct = ARABIC_TO_ENGLISH[value] ?? translateDynamicArabic(value);
    if (direct) return direct;

    // Cart errors can combine two independently curated acceptance messages.
    // Translate each known side while retaining any unknown suffix verbatim.
    const separator = " — ";
    const separatorIndex = value.indexOf(separator);
    if (separatorIndex > 0) {
      const left = value.slice(0, separatorIndex);
      const right = value.slice(separatorIndex + separator.length);
      const translatedLeft = ARABIC_TO_ENGLISH[left] ?? translateDynamicArabic(left);
      const translatedRight = ARABIC_TO_ENGLISH[right] ?? translateDynamicArabic(right);
      if (translatedLeft || translatedRight) {
        return `${translatedLeft ?? left}${separator}${translatedRight ?? right}`;
      }
    }
    return value;
  }
  return ENGLISH_TO_ARABIC[value] ?? value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const SYSTEM_NOTIFICATION_EVENT_TYPES = new Set([
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_READY",
  "ORDER_PICKED_UP",
  "ORDER_DELIVERED",
  "DRIVER_ORDER_OFFER",
  "APPLICATION_APPROVED",
  "APPLICATION_REJECTED",
  "admin_driver_assigned",
]);

type ResponseLocalizationOptions = {
  /**
   * The user notification route is the only response where title/body are
   * eligible for localization. Each item is additionally gated by its known
   * system eventType, so admin-composed notification copy is never rewritten.
   */
  userNotificationsResponse?: boolean;
  /** Kept as a compatibility alias for callers of this helper. */
  notificationResponse?: boolean;
  /** GET /cart has a trusted nested restaurant envelope for these fields. */
  cartResponse?: boolean;
};

function localizeErrorValue(value: unknown, locale: ApiLocale): unknown {
  if (typeof value === "string") return translateApiText(value, locale);
  // Standard middleware errors are { error: { code, message } }. Localize
  // only this immediate message property; never walk arbitrary error objects.
  if (isRecord(value) && typeof value.message === "string") {
    return { ...value, message: translateApiText(value.message, locale) };
  }
  return value;
}

function localizeCartRestaurants(value: unknown, locale: ApiLocale): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((restaurant) => {
    if (!isRecord(restaurant)) return restaurant;
    const result = { ...restaurant };
    for (const key of ["acceptanceReason", "nextOpeningSummary"] as const) {
      if (typeof result[key] === "string") result[key] = translateApiText(result[key], locale);
    }
    return result;
  });
}

function localizeUserNotificationItems(value: unknown, locale: ApiLocale): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((notification) => {
    if (!isRecord(notification) || typeof notification.eventType !== "string" ||
        !SYSTEM_NOTIFICATION_EVENT_TYPES.has(notification.eventType)) {
      return notification;
    }
    const result = { ...notification };
    if (typeof result.title === "string") result.title = translateApiText(result.title, locale);
    if (typeof result.body === "string") result.body = translateApiText(result.body, locale);
    return result;
  });
}

/**
 * Localize only trusted response envelopes. This intentionally does not
 * recurse: recursive translation can rewrite geocode/user labels, audit
 * before/after snapshots, or administrator-authored notification copy.
 */
export function localizeResponseBody(
  body: unknown,
  locale: ApiLocale,
  options: ResponseLocalizationOptions = {},
): unknown {
  if (!isRecord(body)) return body;

  const result = { ...body };
  if ("error" in body) result.error = localizeErrorValue(body.error, locale);
  if (typeof body.message === "string") result.message = translateApiText(body.message, locale);

  if (options.cartResponse) {
    if ("acceptanceReason" in body && typeof body.acceptanceReason === "string") {
      result.acceptanceReason = translateApiText(body.acceptanceReason, locale);
    }
    if ("nextOpeningSummary" in body && typeof body.nextOpeningSummary === "string") {
      result.nextOpeningSummary = translateApiText(body.nextOpeningSummary, locale);
    }
    if ("restaurants" in body) {
      result.restaurants = localizeCartRestaurants(body.restaurants, locale);
    }
  }

  if ((options.userNotificationsResponse || options.notificationResponse) && "items" in body) {
    result.items = localizeUserNotificationItems(body.items, locale);
  }
  return result;
}

/** RFC 9110-style negotiation for the supported `ar` and `en` languages. */
export function negotiateApiLocale(header: string | string[] | undefined): ApiLocale {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return "ar";

  const candidates = raw.split(",").flatMap((part, index) => {
    const [rangePart, ...parameters] = part.trim().split(";");
    const range = rangePart?.trim().toLowerCase();
    if (!range || range === "*") return [];
    const qParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
    const q = qParameter ? Number(qParameter.trim().slice(2)) : 1;
    if (!Number.isFinite(q) || q <= 0) return [];
    const language: ApiLocale | undefined = range === "en" || range.startsWith("en-")
      ? "en"
      : range === "ar" || range.startsWith("ar-")
        ? "ar"
        : undefined;
    return language ? [{ language, q: Math.min(q, 1), index }] : [];
  });

  candidates.sort((a, b) => b.q - a.q || a.index - b.index);
  return candidates[0]?.language ?? "ar";
}

export const requestLocale: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  req.locale = negotiateApiLocale(req.headers["accept-language"]);
  res.setHeader("Content-Language", req.locale);
  res.vary("Accept-Language");
  next();
};

/**
 * Response-boundary localization. Routes continue to author one canonical
 * Arabic response and machine fields (codes, IDs, statuses, money, names,
 * addresses and audit records) remain untouched.
 */
export const localizedJson: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);
  const path = req.path.replace(/\/+$/, "") || "/";
  const userNotificationsResponse = req.method === "GET" &&
    (path === "/notifications" || path === "/api/notifications");
  const cartResponse = req.method === "GET" && (path === "/cart" || path === "/api/cart");
  res.json = ((body: unknown) => originalJson(
    localizeResponseBody(body, req.locale ?? "ar", { userNotificationsResponse, cartResponse }),
  )) as typeof res.json;
  next();
};
