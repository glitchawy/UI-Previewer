import assert from "node:assert/strict";
import test from "node:test";
import {
  detectRefundProofMimeType,
  canReplaceRefundProof,
  normalizeRefundDescription,
  REFUND_PROOF_MAX_BYTES,
} from "./refund-proof";

test("refund proof detection accepts only JPEG, PNG, and WebP signatures", () => {
  assert.equal(detectRefundProofMimeType(Buffer.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
  assert.equal(
    detectRefundProofMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png",
  );
  assert.equal(
    detectRefundProofMimeType(Buffer.from("RIFF0000WEBP")),
    "image/webp",
  );
  assert.equal(detectRefundProofMimeType(Buffer.from("image/png")), null);
  assert.equal(detectRefundProofMimeType(Buffer.from("%PDF")), null);
});

test("refund proof size limit is ten million bytes", () => {
  assert.equal(REFUND_PROOF_MAX_BYTES, 10_000_000);
});

test("complaint descriptions are trimmed before enforcing 10..2000 characters", () => {
  assert.equal(normalizeRefundDescription("   "), null);
  assert.equal(normalizeRefundDescription("  too short  "), null);
  assert.equal(normalizeRefundDescription("  a complaint with enough detail  "), "a complaint with enough detail");
  assert.equal(normalizeRefundDescription("x".repeat(2001)), null);
});

test("pending proof bindings can be replaced, but claimed bindings cannot", () => {
  assert.equal(canReplaceRefundProof(null), true);
  assert.equal(canReplaceRefundProof(123), false);
});