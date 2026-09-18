# Talabat Betak Android wrapper

This package wraps the hosted responsive web app in a native Android WebView for Play Store distribution. The existing `talabat-betak-driver` package remains the native driver app with location and push capabilities.

## Local preview

Set a reachable URL before starting Expo:

```cmd
set EXPO_PUBLIC_WEB_APP_URL=https://your-web-app.example.com
pnpm --filter @workspace/talabat-betak-mobile run dev
```

Do not use `localhost` in a Play Store build. Android devices need a public HTTPS URL.

## Android App Bundle

```cmd
set EXPO_PUBLIC_WEB_APP_URL=https://your-web-app.example.com
pnpm --filter @workspace/talabat-betak-mobile run build:android
```

The production profile produces a signed `.aab` through EAS. Confirm the package ID in `app.json` before the first store build; changing it later creates a different app.