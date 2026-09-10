# Safe operational validation

These commands print only configuration names, modes, and pass/fail results. They never print keys, tokens, checkout secrets, full phone numbers, or object names. The provider checks are dry-run by default.

## Deployment profile boundary

The current shared Replit deployment is intentionally a public test environment. It explicitly sets `DEPLOYMENT_PROFILE=test`, `MOCK_AUTH_ENABLED=true`, and `PUBLIC_TEST_MODE_ENABLED=true`, which enables its DEV MODE role buttons and development fixtures.

For a real customer launch, provision a fresh, isolated production database
(never reuse or clone the shared public-test database), then use this exact
safety configuration:

```sh
DEPLOYMENT_PROFILE=customer
```

Do not set `MOCK_AUTH_ENABLED` or `PUBLIC_TEST_MODE_ENABLED` at all. A customer-profile process fails startup if either test flag is `true`. A missing or unknown profile never enables test login.
Customer startup also fails without modifying data if the database contains any
development fixture identity, an active fixture session, or an active fixture
admin grant.

## Object Storage

This creates a tiny random private object, reads it back, verifies its owner ACL denies an unrelated user, and deletes it in `finally`.

```sh
pnpm validate:storage
```

Run on Replit with `PRIVATE_OBJECT_DIR` configured and the Object Storage sidecar available. A cleanup failure is reported explicitly and fails the command.

## Authevo

Configuration only (no network request and no message):

```sh
AUTHEVO_MODE=sandbox pnpm validate:authevo
AUTHEVO_MODE=live pnpm validate:authevo
```

`AUTHEVO_API_KEY` and `AUTHEVO_WEBHOOK_SECRET` must be in Secrets. `AUTHEVO_MODE` is deliberately separate because readiness tooling cannot safely infer account mode from secret material.

Explicit sandbox round trip (uses sandbox code `123456`; no live message):

```sh
AUTHEVO_MODE=sandbox AUTHEVO_RUN_OTP=1 AUTHEVO_TEST_PHONE='+201XXXXXXXXX' pnpm validate:authevo
```

Explicit live round trip (sends a real message and may incur a provider charge):

```sh
AUTHEVO_MODE=live AUTHEVO_RUN_OTP=1 AUTHEVO_TEST_PHONE='+201XXXXXXXXX' AUTHEVO_TEST_OTP_CODE='123456' pnpm validate:authevo
```

Use only a dedicated test phone. The full phone and OTP are never printed.

## Paymob

Readiness plus a local synthetic callback-HMAC verification (no provider request, transaction, or payment):

```sh
PAYMOB_MODE=sandbox pnpm validate:paymob
PAYMOB_MODE=live pnpm validate:paymob
```

The check requires callback HMAC configuration, numeric integration IDs, a complete Unified Checkout or legacy checkout configuration, and `PAYMOB_PUBLIC_APP_URL` as a canonical HTTPS origin (for example `https://example.com`, with no path/query/fragment).

Explicit sandbox checkout creation (creates a checkout intention but does not submit payment):

```sh
PAYMOB_MODE=sandbox PAYMOB_CREATE_TEST_TRANSACTION=1 PAYMOB_TEST_PHONE='+201XXXXXXXXX' PAYMOB_TEST_AMOUNT_EGP=1 pnpm validate:paymob
```

The opt-in command refuses live mode and amounts above EGP 100. Completing the hosted checkout and observing Paymob's callback remains a manual sandbox step.

## Post-publish deployment smoke

After publishing, check health, unauthenticated auth gating, and both webhook routes. Webhook probes intentionally use invalid signatures, so they must be rejected without changing data.

```sh
DEPLOYMENT_BASE_URL='https://your-production-domain.example' pnpm validate:deployment
```

The URL must be a canonical HTTPS origin. This command does not send an OTP, create a checkout, or submit a valid webhook.