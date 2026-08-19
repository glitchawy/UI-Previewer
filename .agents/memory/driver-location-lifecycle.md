---
name: Driver location lifecycle
description: Privacy and assignment invariants for collecting and exposing a delivery driver's precise location.
---

Collect a driver’s precise GPS only while that approved driver has an assigned active delivery. Expose it only to the customer who owns that order, and only while the order is in the picked-up/in-transit stage. Keep assignment atomic and limit each driver to one active delivery.

**Why:** Continuous collection without active work and location disclosure before pickup or after delivery create unnecessary privacy exposure. Concurrent offer acceptance can also produce conflicting active deliveries unless assignment is fenced.

**How to apply:** Any new dispatch, tracking, notification, or delivery-status feature must preserve the active-assignment check, ordered state transitions, one-active-delivery invariant, customer ownership check, and post-delivery location suppression.