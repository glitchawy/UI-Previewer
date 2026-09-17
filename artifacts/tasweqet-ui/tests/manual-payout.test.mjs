import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("../src/components/tb/manual-payout.tsx", import.meta.url), "utf8");
const api = fs.readFileSync(new URL("../src/lib/manual-payout.ts", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("../src/components/tb/admin-payout-management.tsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../../../docs/manual-payout-contract.md", import.meta.url), "utf8");
const openapi = fs.readFileSync(new URL("../../../lib/api-spec/openapi.yaml", import.meta.url), "utf8");

test("manual payout recipient UI requests the full available balance", () => {
  assert.match(component, /Request full available amount/);
  assert.match(component, /idempotencyKey/);
  assert.match(component, /submittingRef/);
  assert.match(component, /net > 0/);
  assert.match(component, /status === "pending"/);
});

test("manual payout UI includes all channels and private proof viewing", () => {
  for (const channel of ["instapay", "mobile_wallet", "cash_branch"]) {
    assert.match(component, new RegExp(channel));
    assert.match(contract, new RegExp(channel));
  }
  assert.match(component, /loadPrivatePayoutProof/);
  assert.match(api, /Authorization/);
  assert.match(api, /settings: PayoutSettingsPreview/);
  assert.match(api, /admin\/payouts\/\$\{id\}\/proof/);
  assert.match(api, /X-Receipt-Signed/);
  assert.doesNotMatch(api, /storage\/uploads/);
  const settingsInput = openapi.match(/ManualPayoutSettingsInput:[\s\S]*?(?=\n\s{4}\w)/)?.[0] ?? "";
  assert.match(settingsInput, /required: \[version, channels, defaultFeePayer, reason\]/);
  assert.doesNotMatch(settingsInput, /updatedAt/);
});

test("admin payout flow does not expose the legacy settlement paid shortcut", () => {
  assert.match(admin, /adminPayoutProof/);
  assert.match(admin, /Transfer proof/);
  assert.match(admin, /signed cash receipt/);
  assert.match(admin, /Registered identity/);
  assert.match(admin, /Current payout destination/);
  assert.match(admin, /recipientName/);
  assert.match(admin, /recipientPhone/);
  assert.match(api, /AdminPayoutSettingsInput/);
  assert.match(admin, /\/admin\/payout-settings/);
  assert.doesNotMatch(fs.readFileSync(new URL("../src/routes/admin.settlements.tsx", import.meta.url), "utf8"), /changeState/);
});