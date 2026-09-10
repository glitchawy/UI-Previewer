---
name: Cash delivery accounting
description: Business meaning of payment, allocation, payout, and skipped recovery states for cash-on-delivery orders.
---

A delivered cash order is paid once collection is confirmed, then its value is allocated across restaurant net, restaurant commission, driver share, and platform delivery share. The restaurant settlement remains pending until an administrator approves and completes a real payout.

Refunded, failed, or cancelled payment states are not settlement-eligible. Recovery should mark their work items as safely skipped rather than changing payment state or creating accounting entries.

**Why:** Accounting allocation records what each party earned or is owed; payout status records whether money was actually transferred. Marking a restaurant settlement paid during order delivery would falsely claim that a payout occurred.

**How to apply:** Keep delivery settlement and recovery idempotent, preserve the pending restaurant payout lifecycle, and require the order-level allocations to reconcile exactly before considering an eligible cash order complete.