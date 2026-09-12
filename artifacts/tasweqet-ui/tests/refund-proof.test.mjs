import assert from "node:assert/strict";
import test from "node:test";
import {
  REFUND_PROOF_MAX_BYTES,
  privateStorageObjectUrl,
  refundProofValidationError,
} from "../src/lib/refund-proof-helpers.ts";

test("refund proof validation enforces the supported image types and 10 MB limit", () => {
  assert.equal(refundProofValidationError({ type: "image/jpeg", size: 1024 }), null);
  assert.equal(refundProofValidationError({ type: "image/gif", size: 1024 }), "type");
  assert.equal(refundProofValidationError({ type: "image/png", size: REFUND_PROOF_MAX_BYTES + 1 }), "size");
});

test("private storage URLs only accept stored object paths", () => {
  assert.equal(
    privateStorageObjectUrl("/objects/refunds/order-1/photo.webp"),
    "/api/storage/objects/refunds/order-1/photo.webp",
  );
  assert.equal(privateStorageObjectUrl("https://example.test/photo.webp"), null);
  assert.equal(privateStorageObjectUrl("/objects/../photo.webp"), null);
});