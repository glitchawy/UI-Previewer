# Paymob hosted checkout setup

Use **test-mode** credentials first. Keep every value in Replit Secrets; never put a key in source control or browser code.

## Credentials

In the Paymob **Accept Dashboard**, select the intended mode with the live/test toggle before copying mode-specific values.

| Replit Secret | Paymob dashboard location | Notes |
| --- | --- | --- |
| `PAYMOB_API_KEY` | **Settings → Developers → API Keys → API Key** | Used by the legacy Accept refund API and legacy checkout fallback. The API Key is shared across modes. |
| `PAYMOB_SECRET_KEY` | **Settings → Developers → API Keys → Secret Key** | Required for the current Unified Checkout Intention API. Test and live values differ. |
| `PAYMOB_PUBLIC_KEY` | **Settings → Developers → API Keys → Public Key** | Used only in the hosted checkout URL. Test and live values differ. |
| `PAYMOB_INTEGRATION_IDS` | **Settings → Payment Integrations → Integration ID** | Required for Unified Checkout. Add every enabled rail as a comma-separated list, for example `12345,67890`: one Visa/card integration ID and one wallet integration ID. Test and live IDs differ. |
| `PAYMOB_INTEGRATION_ID` *(compatibility fallback)* | **Settings → Payment Integrations → Integration ID** | A single rail for older/legacy iframe accounts. Use `PAYMOB_INTEGRATION_IDS` to offer Visa and wallets together in Unified Checkout. |
| `PAYMOB_HMAC_SECRET` | **Settings → Developers → API Keys → HMAC Secret** | Verifies the transaction callback. Do not use a redirect alone as proof of payment. |
| `PAYMOB_IFRAME_ID` *(legacy fallback only)* | **Settings → Payment Integrations → iframe integration details** | Needed only when using the older API-key plus iframe checkout path instead of Unified Checkout. |
| `PAYMOB_PUBLIC_APP_URL` *(Replit environment variable, not a secret)* | The published production URL of this app | Must be a canonical `https://` URL, with no query string or fragment. The server derives every Paymob callback and return URL from this value, never from a browser request header. |

## Callback configuration

For every selected Payment Integration, open its integration details in **Settings → Payment Integrations** and set:

- **Webhook URL:** `https://<published-app-domain>/api/webhooks/paymob`
- **Redirect URL:** the hosted checkout sends customers back to the URL supplied while the payment session is created. Use the same published app domain in Paymob's allowed-domain settings.

For Visa and wallets, create or enable each rail in Paymob, then place each Integration ID in `PAYMOB_INTEGRATION_IDS`. Unified Checkout receives the full list and shows the payment methods available to that customer; the server accepts a verified callback only when its signed integration ID is one of the IDs saved for that checkout.

The server verifies the `hmac` callback value before it changes a payment. A valid successful callback marks every restaurant order in that checkout session as paid and confirmed. A valid failed callback marks those card orders as failed and cancelled. Replayed callbacks are safe.

Card checkout reserves the cart for up to one hour while the customer is on Paymob. A successful callback removes only the reserved cart lines. A failed callback, a payment-status check after that one-hour timeout, or the API server’s once-per-minute expiry worker releases those lines so the customer can retry without rebuilding the cart.

If the provider connection times out while creating checkout, the server deliberately keeps the internal payment pending instead of cancelling it: Paymob may have accepted the request and can still send a verified callback using the saved merchant reference. This prevents a customer from being charged for an order that was incorrectly cancelled.

After two minutes, the server uses Paymob’s order inquiry API to check the saved merchant reference for any ambiguous creation attempt. It never creates a second checkout while the first attempt is uncertain: the session remains under reconciliation until Paymob supplies a verified callback or the original one-hour checkout expiry releases the cart. This inquiry requires `PAYMOB_API_KEY` in addition to the Unified Checkout keys. Explicit deterministic Paymob client rejections (for example invalid credentials or invalid request data) are different: they cancel the temporary order and immediately unlock the cart.

## Go-live checklist

1. Publish the app and use its production URL for Paymob's webhook and allowed redirect domain.
2. Add the test-mode secrets in Replit, make a test payment, and verify both the order detail and the Paymob callback log.
3. Switch the Paymob dashboard to live mode, replace the mode-specific Secret Key, Public Key, and Integration ID in Replit Secrets, then repeat a small live transaction.
4. Keep `PAYMOB_HMAC_SECRET` server-only. Never expose it in the React application.