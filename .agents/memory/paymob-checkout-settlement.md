---
name: Paymob checkout settlement
description: Safety rules for hosted Paymob sessions that cover more than one restaurant order.
---

A card checkout is one payment session that can cover several restaurant orders. Settle its linked orders only after a terminal Paymob callback has passed HMAC verification and its amount, currency, and integration match the saved session. Reserve, rather than clear, its cart lines until that settlement.

**Why:** A browser return is not proof of payment, pending wallet events are not terminal outcomes, and a provider callback may report a different order id from the intention response. Incorrectly accepting any one of those can confirm or cancel the wrong restaurant orders; clearing the cart before settlement strands customers after a decline or abandoned checkout.

**How to apply:** Derive callback and redirect URLs from the canonical configured HTTPS application URL, use the merchant reference as a fallback session lookup, retain pending sessions on non-terminal events, and preserve the callback’s advisory-lock/idempotency flow when adding captures, refunds, or retries. Save the full configured card-and-wallet integration list on each session and accept callbacks only from that saved list. Commit the internal reservation before the provider call, release it on a deterministic provider rejection or expiry, and use the server expiry worker to handle customers who never return. Never retry an uncertain provider-creation attempt until provider inquiry proves no order exists; otherwise preserve it for reconciliation or expiry.