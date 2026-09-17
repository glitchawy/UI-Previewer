# Manual payout contract

This is the source-of-truth contract for the manual driver/restaurant payout
API. Payouts are bookkeeping and an administrator's manual transfer record; no
Paymob transfer is attempted.

## Scope and policy

- Roles are `driver` and `partner` (restaurant owner). Role-scoped routes use
  the generic `/payouts` resource.
- Supported channels and default fixed fees (EGP) are `instapay` (5),
  `mobile_wallet` (10), and `cash_branch` (100). The admin can change each
  default and the fee payer (`recipient` or `platform`).
- The fee and fee payer are copied into every payout request at creation and
  never change if settings later change. The recipient pays by default.
- A request contains the full currently spendable, credited ledger balance for
  the requesting role; clients must not send an amount. The server creates one
  allocation reservation per driver earning or restaurant settlement source.
- Approval is separate from payment. Cancelling is allowed only while pending;
  rejecting is an admin transition from pending or approved. A request can be
  marked paid only after an admin has attached proof and (for electronic
  channels) a transfer reference. Cash requires a signed receipt proof.
- Proofs are private owner/admin objects and must be JPEG, PNG, or WebP no larger
  than 10 MB. The proof endpoint returns `{ "objectPath": "/objects/..." }`.
- Existing settlement administration must not mark a restaurant settlement
  paid. `/admin/operations/settlements/:id/state` rejects `status=paid` and
  directs operators to the payout workflow.
- New legacy aggregate settlement generation is disabled. Existing aggregate
  snapshots remain readable for reconciliation, but a paid aggregate covering
  a per-order cash settlement excludes those per-order credits from a new
  restaurant payout.
- The ledger and allocation rows are locked in one database transaction. A
  pending/approved request reserves sources; rejection/cancellation releases
  them; payment consumes them. The payout payment creates exactly one wallet
  debit where a wallet debit is needed and is guarded by the payout id. Every
  wallet debit path subtracts active payout holds before checking spendable
  balance, so an order payment, adjustment, or other generic debit cannot
  consume funds already reserved for a payout.

## DTOs

All money fields are JSON numbers in EGP; timestamps are ISO strings.

### `GET /payouts`

Returns:

```ts
{
  summary: {
    available: number,
    reserved: number,
    approved: number,
    paid: number,
    fee: number,
    currency: "EGP"
  },
  settings: {
    version: number,
    channels: {
      instapay: { fee: number },
      mobile_wallet: { fee: number },
      cash_branch: { fee: number }
    },
    defaultFeePayer: "recipient" | "platform",
    updatedAt: string | null
  },
  requests: ManualPayoutRequest[]
}
```

`available` excludes all active reservations and historical paid sources.
`reserved` includes pending and approved requests. `approved` is an
approved-but-not-paid request total. `paid` is the historical net amount paid.

### `POST /payouts`

Request:

```ts
{
  channel: "instapay" | "mobile_wallet" | "cash_branch",
  destination: {
    accountName: string,
    instapayAddress?: string,
    mobileNumber?: string,
    branch?: string
  },
  idempotencyKey: string
}
```

The request is rejected if the available ledger total is not strictly positive,
the destination does not match its channel, or the idempotency key was used
with a different request. Response is a `ManualPayoutRequest`.

### `POST /payouts/:id/cancel`

No body. Releases all reservations and returns the cancelled request.

### `GET /admin/payouts`

Query parameters: `status`, `role`, `page`, `pageSize`. Response is
`{ items: ManualPayoutRequest[], page, pageSize, total, totalPages }`.

### Admin transitions

- `POST /admin/payouts/:id/approve`: body `{ reason: string }`
- `POST /admin/payouts/:id/reject`: body `{ reason: string }`
- `POST /admin/payouts/:id/paid`: body
  `{ reason: string, transferReference?: string }`
- `POST /admin/payouts/:id/proof`: raw request body containing JPEG, PNG, or
  WebP bytes. Set `Content-Type` to the actual image MIME type; the server
  detects the signature and size, generates the private object path, uploads
  the bytes itself, and binds that generated path to the payout. Clients must
  not send `objectPath`, `contentType`, or `size`, and arbitrary existing
  object paths are never trusted. Set `X-Receipt-Signed: true` only for a
  signed cash receipt.

Admin transition responses are `ManualPayoutRequest`. `paid` is impossible
without a valid bound proof. Electronic channels require a transfer reference;
cash requires a receipt proof (the proof metadata must identify it as a signed
receipt).

### `GET /admin/payout-settings`

Returns:

```ts
{
  version: number,
  channels: {
    instapay: { fee: number },
    mobile_wallet: { fee: number },
    cash_branch: { fee: number }
  },
  defaultFeePayer: "recipient" | "platform",
  updatedAt: string | null
}
```

### `PUT /admin/payout-settings`

Request includes `version`, `channels`, `defaultFeePayer`, and
`reason: string`. The response-only `updatedAt` field is not accepted in the
request body. Updates use optimistic concurrency and append an audit record;
stale versions return `409`.

## Future provider automation

The request and allocation records include channel, provider metadata, and
transfer-reference fields so an automated provider can be added later. The
current implementation deliberately has no outbound Paymob payout call and
does not claim that manual proof is a provider confirmation.