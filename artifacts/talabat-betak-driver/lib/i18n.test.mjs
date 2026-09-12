import assert from "node:assert/strict";
import test from "node:test";
import {
  directionForLocale,
  documentTypeLabel,
  formatCurrency,
  formatDate,
  normalizeLocale,
  statusLabel,
  translate,
  translationKeys,
} from "./i18n.ts";
import { persistLocale, readPersistedLocale } from "../utils/localeStorage.ts";

test("Arabic is the default and switching has an explicit translation", () => {
  assert.equal(normalizeLocale(undefined), "ar");
  assert.equal(translate("ar", "tabs.offers"), "العروض");
  assert.equal(translate("en", "tabs.offers"), "Offers");
  assert.notEqual(translate("ar", "login.title"), translate("en", "login.title"));
});

test("every translation key has both Arabic and English values", () => {
  for (const key of translationKeys()) {
    assert.notEqual(translate("ar", key), key, `missing Arabic translation: ${key}`);
    assert.notEqual(translate("en", key), key, `missing English translation: ${key}`);
  }
});

test("direction and localized domain labels are pure", () => {
  assert.equal(directionForLocale("ar"), "rtl");
  assert.equal(directionForLocale("en"), "ltr");
  assert.equal(statusLabel("ar", "picked_up"), "تم الاستلام");
  assert.equal(statusLabel("en", "picked_up"), "Picked up");
  assert.equal(documentTypeLabel("ar", "driving_license"), "رخصة القيادة");
  assert.equal(documentTypeLabel("en", "driving_license"), "Driving license");
});

test("currency and dates use the selected locale", () => {
  assert.equal(formatCurrency("ar", 12.5), "12.50 ج.م.");
  assert.equal(formatCurrency("en", 12.5), "12.50 EGP");
  assert.notEqual(formatDate("ar", "2025-01-02T12:00:00.000Z"), formatDate("en", "2025-01-02T12:00:00.000Z"));
});

test("locale persistence uses the existing async storage contract", async () => {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
  assert.equal(await readPersistedLocale(storage), "ar");
  await persistLocale(storage, "en");
  assert.equal(await readPersistedLocale(storage), "en");
  await persistLocale(storage, "ar");
  assert.equal(await readPersistedLocale(storage), "ar");
});