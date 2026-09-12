---
name: Egyptian phone canonicalization
description: Stable identity and rate-limit semantics for Egyptian mobile numbers entered in local or international formats.
---

Accept common Egyptian mobile input forms, including local `01…`, international `+201…`, `00201…`, `201…`, and Arabic-Indic digits, but canonicalize every valid value to the local `01XXXXXXXXX` form before identity lookup, storage, OTP operations, and verification.

Rate limiting must use the same canonical identity so formatting differences cannot create separate buckets. Malformed values should use a bounded invalid key rather than a raw user-supplied value.

**Why:** A driver entered a valid `+20…` number and received a generic OTP failure because the API only recognized local form. Different normalization between validation, database lookup, and rate limiting can also cause false “not registered” results or allow limit bypasses.

**How to apply:** Use one shared server normalizer at every authentication boundary. Clients may normalize early for better feedback, but server normalization remains authoritative and stored phone identities remain canonical.

Account type is a permanent signup decision tied to the phone identity, not a login option. Do not add account-type switching or allow a second role account on the same number.

**Why:** The user explicitly requires one phone to identify one account type permanently; asking for type at login contradicts that product model.

**How to apply:** Future authentication and admin features must preserve this constraint. Login must use the stored account type, never a caller-provided role or route parameter. Keep test-only DEV shortcuts clearly separate from normal login.