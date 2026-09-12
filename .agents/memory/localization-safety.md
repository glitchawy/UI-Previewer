---
name: Localization safety
description: Constraints for bilingual presentation without disrupting business flows or altering authored data.
---

Language switching is a presentation change, not a session, assignment, or form reset. Refresh localized server responses without discarding unsaved edits; never make the selected language a dependency that stops tracking or purges queued driver coordinates. Hydrate the saved native locale before authenticated requests begin.

**Why:** Localization review exposed stale manual caches, early Arabic requests on saved-English native startup, and a tracking effect whose language dependency could clear queued location updates.

**How to apply:** Test language changes while forms contain unsaved input and drivers have active work. Keep operational effects dependent on operational identities, not translated strings or translation functions.

Translate only identified system-authored response fields. Preserve restaurant/menu names, addresses, administrator-composed notifications, and audit snapshots verbatim, even if their text matches a known translation.

**Why:** Recursive translation by common property names such as label, message, title, and body can silently alter authored business data and historical audit evidence.

**How to apply:** Restrict response localization to explicit endpoint/envelope shapes and known system event types; add exact-match user-content preservation tests when expanding coverage.