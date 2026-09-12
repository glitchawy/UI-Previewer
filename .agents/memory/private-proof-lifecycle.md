---
name: Private proof upload lifecycle
description: Recovery and ownership requirements for complaint photos uploaded before submission.
---

Unclaimed proof uploads must remain replaceable after remove, reload, or a lost upload response. Claiming a proof and replacing it must use the same per-order lock.

**Why:** A unique upload binding without replacement can permanently block an eligible refund when the browser loses its local upload path. Proof photos must never become public just to make admin previews work.

**How to apply:** Bind uploads to the owning customer and order, reject replacement after submission, clean up superseded or failed uploads, and test real remove/re-upload recovery. Authorize reviewers by refund permissions rather than unrelated application-review permissions.