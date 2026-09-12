import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { personalGreeting } from "../src/lib/personal-greeting.ts";

test("greets people by their saved name in either language", () => {
  assert.equal(personalGreeting("Hello", "  Mohamed Ali  "), "Hello Mohamed Ali");
  assert.equal(personalGreeting("أهلاً", "محمد علي"), "أهلاً محمد علي");
  assert.equal(personalGreeting("Hello", "محمد علي"), "Hello محمد علي");
});

test("missing names produce a greeting without a phone or invented identity", () => {
  for (const name of [null, undefined, "", "   "]) {
    assert.equal(personalGreeting("Hello", name), "Hello");
  }
});

test("all personalized welcome surfaces use names, not phone numbers", async () => {
  for (const route of ["app.index", "driver", "driver.index"]) {
    const source = await readFile(new URL(`../src/routes/${route}.tsx`, import.meta.url), "utf8");
    assert.match(source, /personalGreeting\(t\("أهلاً 👋", "Hello 👋"\), session\??\.user\.name\)/);
    assert.doesNotMatch(source, /\+20\$\{session\??\.user\.phone|\+20\{session\.user\.phone/);
  }
});