import assert from "node:assert/strict";
import test from "node:test";
import {
  localizeResponseBody,
  localizedJson,
  negotiateApiLocale,
  translateApiText,
} from "./localization";

test("negotiates supported language ranges and defaults to Arabic", () => {
  assert.equal(negotiateApiLocale(undefined), "ar");
  assert.equal(negotiateApiLocale("en"), "en");
  assert.equal(negotiateApiLocale("en-US,en;q=0.9,ar;q=0.8"), "en");
  assert.equal(negotiateApiLocale("fr-FR,ar;q=0.5"), "ar");
  assert.equal(negotiateApiLocale("en;q=0,ar;q=0.8"), "ar");
});

test("keeps Arabic as the default and translates curated templates", () => {
  assert.equal(translateApiText("غير مصرح", "ar"), "غير مصرح");
  assert.equal(translateApiText("غير مصرح", "en"), "Unauthorized");
  assert.equal(
    translateApiText("انتظر 30 ثانية قبل إعادة الإرسال", "en"),
    "Wait 30 seconds before resending",
  );
  assert.equal(
    translateApiText("تم رفض طلب الانضمام: سبب خاص بالمستخدم", "en"),
    "Your application was rejected: سبب خاص بالمستخدم",
  );
  assert.equal(
    translateApiText("المطعم مغلق حالياً — يفتح يومياً الساعة 12:00", "en"),
    "The restaurant is currently closed — Opens daily at 12:00",
  );
});

test("does not translate unknown content or machine fields", () => {
  const createdAt = new Date("2025-01-01T00:00:00.000Z");
  const response = localizeResponseBody({
    id: 12,
    status: "PENDING",
    name: "مطعم المستخدم",
    error: "رسالة غير موجودة في الكتالوج",
    code: "APPLICATION_PENDING",
    createdAt,
  }, "en");
  assert.deepEqual(response, {
    id: 12,
    status: "PENDING",
    name: "مطعم المستخدم",
    error: "رسالة غير موجودة في الكتالوج",
    code: "APPLICATION_PENDING",
    createdAt,
  });
});

test("localizes trusted API envelopes without rewriting user-facing names", () => {
  const response = localizeResponseBody({
    error: { code: "BAD_REQUEST", message: "بيانات الطلب غير صحيحة" },
    name: "اسم مطعم كتبه المستخدم",
    status: "APPROVED",
  }, "en");
  assert.deepEqual(response, {
    error: { code: "BAD_REQUEST", message: "Invalid request data" },
    name: "اسم مطعم كتبه المستخدم",
    status: "APPROVED",
  });
});

test("does not rewrite geocode/user labels, even for exact catalog matches", () => {
  assert.deepEqual(
    localizeResponseBody({ label: "تم قبول طلبك", addressText: "عنوان المستخدم" }, "en"),
    { label: "تم قبول طلبك", addressText: "عنوان المستخدم" },
  );
});

test("does not recurse into audit before/after snapshots", () => {
  const audit = {
    action: "notification.composed",
    before: { message: "بيانات الطلب غير صحيحة", label: "تم قبول طلبك" },
    after: { error: "غير مصرح", message: "تم قبول طلبك" },
  };
  assert.deepEqual(localizeResponseBody(audit, "en"), audit);
});

test("localizes only known system notifications on the user endpoint", () => {
  const response = localizeResponseBody({
    items: [
      {
        eventType: "APPLICATION_APPROVED",
        title: "تم قبول طلبك",
        body: "تهانينا، تمت الموافقة على طلب الانضمام.",
      },
      {
        eventType: "admin_composed",
        title: "تم قبول طلبك",
        body: "تهانينا، تمت الموافقة على طلب الانضمام.",
      },
    ],
  }, "en", { userNotificationsResponse: true });
  assert.deepEqual(response, {
    items: [
      {
        eventType: "APPLICATION_APPROVED",
        title: "Your application was approved",
        body: "Congratulations, your application was approved.",
      },
      {
        eventType: "admin_composed",
        title: "تم قبول طلبك",
        body: "تهانينا، تمت الموافقة على طلب الانضمام.",
      },
    ],
  });
});

test("admin notification envelopes preserve arbitrary title and body copy", () => {
  const response = localizeResponseBody({
    items: [{
      eventType: "admin_composed",
      title: "تم قبول طلبك",
      body: "تهانينا، تمت الموافقة على طلب الانضمام.",
    }],
  }, "en");
  assert.deepEqual(response, {
    items: [{
      eventType: "admin_composed",
      title: "تم قبول طلبك",
      body: "تهانينا، تمت الموافقة على طلب الانضمام.",
    }],
  });
});

test("the admin notifications route is not treated as the user notifications route", () => {
  let sent: unknown;
  const originalJson = (body: unknown) => {
    sent = body;
    return response;
  };
  const response = { json: originalJson } as { json: (body: unknown) => unknown };
  localizedJson(
    { method: "GET", path: "/api/admin/operations/notifications", locale: "en" } as never,
    response as never,
    () => undefined,
  );
  response.json({
    items: [{
      eventType: "admin_composed",
      title: "تم قبول طلبك",
      body: "تهانينا، تمت الموافقة على طلب الانضمام.",
    }],
  });
  assert.deepEqual(sent, {
    items: [{
      eventType: "admin_composed",
      title: "تم قبول طلبك",
      body: "تهانينا، تمت الموافقة على طلب الانضمام.",
    }],
  });
});

test("localizes acceptance fields only in the trusted cart envelope", () => {
  assert.deepEqual(
    localizeResponseBody({
      restaurants: [{
        acceptanceReason: "المطعم مغلق حالياً",
        nextOpeningSummary: "يفتح يومياً الساعة 12:00",
        name: "المطعم مغلق حالياً",
      }],
    }, "en", { cartResponse: true }),
    {
      restaurants: [{
        acceptanceReason: "The restaurant is currently closed",
        nextOpeningSummary: "Opens daily at 12:00",
        name: "المطعم مغلق حالياً",
      }],
    },
  );
});
