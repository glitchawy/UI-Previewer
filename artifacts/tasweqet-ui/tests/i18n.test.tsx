import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage();
Object.assign(globalThis, {
  window: {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
  },
  document: { documentElement: { lang: "", dir: "" } },
});

const i18n = await import("../src/lib/i18n.tsx");

test("locale persistence and document direction", () => {
  i18n.setLocale("en");
  assert.equal(storage.getItem(i18n.LOCALE_STORAGE_KEY), "en");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(document.documentElement.dir, "ltr");
  i18n.setLocale("ar");
  assert.equal(document.documentElement.dir, "rtl");
});

test("interpolation and empty-string fallback", () => {
  i18n.setLocale("en");
  assert.equal(i18n.translate("أهلاً {name}", "Hello {name}", { name: "Mona" }), "Hello Mona");
  assert.equal(i18n.translate("النص العربي", ""), "النص العربي");
});

test("shared formatting follows the active locale", () => {
  i18n.setLocale("en");
  assert.match(i18n.formatNumber(1234), /1,234/);
  assert.match(i18n.formatCurrency(20), /20/);
  assert.equal(i18n.getDirection(), "ltr");
  i18n.setLocale("ar");
  assert.match(i18n.formatNumber(1234), /١٬٢٣٤/);
  assert.equal(i18n.getDirection(), "rtl");
});