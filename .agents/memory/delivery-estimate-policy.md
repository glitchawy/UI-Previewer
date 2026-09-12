---
name: Delivery estimate policy
description: Why delivery estimates use a distance approximation instead of an external routing service.
---

Use a fixed 20-minute preparation allowance plus approximate restaurant-to-delivery travel time, and label the result approximate.

**Why:** The user explicitly chose distance-based estimation with no external service or usage charges, rather than Google Maps road/traffic estimates.

**How to apply:** Do not introduce a paid routing dependency or describe these estimates as live traffic without new authorization. Preserve the estimate shown at placement; do not silently recalculate historical promises using a changed address or interpret original total duration as remaining time.

When a calculated estimate is unavailable, show a fixed 30-minute–1-hour window.

**Why:** The user explicitly requested this fallback instead of the unavailable message.

**How to apply:** Apply the window to missing estimates only, including grouped summaries. Keep valid calculated estimates and historical stored data unchanged.