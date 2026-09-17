# Manual settlements: operating policy

## Purpose

Drivers and restaurant partners request payment of eligible credited earnings.
An administrator reviews the request, performs the transfer outside this app,
and records proof before marking the request paid. This is **not an automatic
transfer service**. Paymob customer checkout and refunds are separate from
driver/restaurant payouts.

See [the API contract](manual-payout-contract.md) for technical fields and routes.

## Channels and launch fees

The same launch rates apply to drivers and restaurants:

| Channel | Fixed fee per request | Recipient receives on a 1,000 EGP request |
| --- | ---: | ---: |
| Instapay | 5 EGP | 995 EGP |
| Mobile wallet | 10 EGP | 990 EGP |
| Cash at branch | 100 EGP | 900 EGP |

The recipient pays by default. Fees are settlement service charges configured
by this business, not claims about the payment providers' own tariffs.

Admin settings can change fees and choose platform-paid fees instead. With
platform-paid fees the recipient receives the full requested earnings; the
platform bears the additional fee. That fee is a recorded cost, not another
deduction from the recipient. Changing settings affects new requests only:
existing requests retain their fee, payer, destination, and net-payment snapshot.

Recipient-paid requests must produce a positive net amount. For example, a
cash request of 100 EGP or less cannot proceed with the launch fee.

## Recipient workflow

1. Open restaurant settlements or the driver's wallet/earnings screen.
2. Check available earnings and amounts already reserved for a payout.
3. Choose a channel and provide the account holder name plus:
   - Instapay: the receiving Instapay identifier.
   - Mobile wallet: the receiving Egyptian mobile-wallet number.
   - Cash at branch: the intended collection branch.
4. Review the gross earnings, fee payer, fee, and exact net amount.
5. Confirm the request. The current manual flow requests the entire eligible
   available batch, not an arbitrary partial withdrawal.
6. Follow the status. A pending request may be cancelled; an approved request
   requires the administrator's intervention.

Verify destination details before submission. The app records an address or
number; it does **not** establish that the receiving bank/wallet account exists
or belongs to the named recipient. Do not collect PINs, OTPs, passwords, or
banking credentials.

## Administrator workflow

### Review and approve

1. Open payout requests and inspect the recipient, eligible earnings, destination,
   fee snapshot, and net amount.
2. Check recipient identity and payout details against your business records.
3. Reject incorrect requests with an explanation, or approve with a review note.

**Approved means authorized for payment, not paid.** Approval must not be used
as proof that a transfer occurred.

### Perform and record payment

1. Confirm the request is approved and has not already been paid.
2. Assign one operator to execute the payment. Do not have multiple operators
   transfer the same request concurrently. The application can prevent duplicate
   ledger posting, but cannot undo duplicate transfers made in external apps.
3. Transfer the displayed **net amount**, not the gross amount, through the
   chosen channel.
4. For electronic payments, obtain the completed transfer receipt and reference.
   A pending transfer screen is not sufficient evidence of success.
5. For branch cash, verify identity, hand over the net amount, and obtain a
   signed receipt identifying the payout, amount, recipient, date, and branch.
6. Upload the receipt image to this request, enter the transfer reference where
   required, record the payment note, and mark paid.
7. Confirm the request shows paid and the recipient's history reflects it.

Proof is private and restricted to the recipient and authorized administrators.
Avoid unrelated sensitive information in receipts.

### Failures and uncertain transfers

- If no transfer occurred, retain the approved request while investigating or
  reject it with a reason to release the reservation.
- If transfer success is uncertain, **do not reject, cancel, or transfer again**.
  Verify the transfer with the provider or bank first.
- If payment succeeded but the app save failed, retry recording the same payment;
  do not send another transfer. Preserve the receipt and reference.
- Paid requests are final operational records. Do not delete or edit financial
  history to correct mistakes; use a reviewed, auditable correction process.

## Accounting safeguards

- Only eligible, credited earnings support payout requests; an earnings display
  is not necessarily a withdrawable balance.
- Active requests reserve funds so they cannot fund another request.
- Cancellation/rejection releases the reservation; approval does not pay it.
- Recording paid consumes the reserved earnings once. Repeated requests must
  not produce a second wallet debit or payout.
- Historical restaurant settlements already marked paid must not become
  available again. The legacy settlement status control cannot bypass the
  proof-backed payout workflow.
- Compensation responsibility on customer complaints does not automatically
  deduct driver or restaurant earnings.

## Future Paymob automation

Do not enable automated payouts merely by supplying existing checkout keys.
Before implementation:

1. Confirm the contracted provider supports disbursements to each required
   channel and obtain its current API, eligibility, limits, and commercial terms.
2. Keep the request, reservation, fee snapshot, and approval model; add a provider
   adapter rather than bypassing them.
3. Introduce explicit submission, processing, success, failure, and ambiguous
   states. Persist a stable provider idempotency key before sending funds.
4. Verify callbacks/signatures and reconcile provider references and statements.
   A timeout is not proof of failure and must not trigger an unverified retry.
5. Finalize the same ledger operation only on verified payment success. Prevent
   manual and automated operators from paying the same request.
6. Keep cash collection manual unless a separately designed process replaces it.
7. Test sandbox and controlled live payouts, reversals, failed callbacks,
   duplicate callbacks, reconciliation, and operator permissions before rollout.

No automatic Paymob disbursement is enabled by the manual settlement feature.