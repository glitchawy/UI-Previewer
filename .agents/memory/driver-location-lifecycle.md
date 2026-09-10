---
name: Driver location lifecycle
description: Privacy and assignment invariants for collecting and exposing a delivery driver's precise location.
---

Collect a driver’s precise GPS only while that approved, online driver has an assigned active delivery. Expose it only to the customer who owns that order, and only while the order is in the picked-up/in-transit stage. For pre-assignment nearest-driver matching, accept only foreground, two-decimal coarse location in separate dispatch fields and never expose those coordinates. Scope queued precise points to the authenticated driver and active order. Keep assignment atomic and limit each driver to one active delivery.

**Why:** Continuous precise collection without active work and location disclosure before pickup or after delivery create unnecessary privacy exposure. Matching still needs an approximate idle location, while unscoped retries can replay one trip’s coordinates into another. Concurrent offer acceptance can also produce conflicting active deliveries unless assignment is fenced.

**How to apply:** Any new dispatch, tracking, notification, or delivery-status feature must preserve approved/online/active checks for precise GPS, coarse-only idle matching, queue identity/age checks, ordered state transitions, one-active-delivery fencing, customer ownership, and post-delivery suppression.