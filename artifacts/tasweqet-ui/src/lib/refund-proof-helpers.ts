export const REFUND_PROOF_MAX_BYTES = 10_000_000;
export const REFUND_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type RefundProofValidationError = "missing" | "type" | "size";
export type RefundProofFile = Pick<Blob, "size" | "type">;

/** Pure client-side constraints shared by the UI and focused tests. */
export function refundProofValidationError(
  file: RefundProofFile | null | undefined,
): RefundProofValidationError | null {
  if (!file) return "missing";
  if (!REFUND_PROOF_MIME_TYPES.includes(file.type as (typeof REFUND_PROOF_MIME_TYPES)[number])) {
    return "type";
  }
  if (file.size <= 0 || file.size > REFUND_PROOF_MAX_BYTES) return "size";
  return null;
}

/**
 * Convert a stored `/objects/...` reference into a private API URL without
 * accepting absolute URLs or path traversal segments.
 */
export function privateStorageObjectUrl(objectPath: string | null | undefined): string | null {
  const normalized = typeof objectPath === "string" ? objectPath.trim() : "";
  if (!normalized.startsWith("/objects/")) return null;
  const segments = normalized.slice("/objects/".length).split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }
  return `/api/storage/objects/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}