/**
 * Refund proof uploads intentionally support only image formats whose file
 * signatures can be checked without trusting a client-supplied MIME header.
 */
export const REFUND_PROOF_MAX_BYTES = 10_000_000;

export type RefundProofMimeType = "image/jpeg" | "image/png" | "image/webp";

export function normalizeRefundDescription(value: string): string | null {
  const normalized = value.trim();
  return normalized.length >= 10 && normalized.length <= 2000 ? normalized : null;
}

/** Claimed proofs are immutable; an unclaimed upload may be replaced safely. */
export function canReplaceRefundProof(refundRequestId: number | null): boolean {
  return refundRequestId === null;
}

export function detectRefundProofMimeType(buf: Buffer): RefundProofMimeType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}