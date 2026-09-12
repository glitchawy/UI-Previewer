import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { setAuthTokenGetter, setLocaleGetter } from '@workspace/api-client-react';
import { getToken } from './lib/auth-session';
import { getLocale, LocaleProvider, subscribeLocale } from './lib/i18n';
import './index.css';

// Automatically attach the session Bearer token to every API request
setAuthTokenGetter(getToken);
// Keep generated API requests in sync with the selected web locale.
setLocaleGetter(getLocale);

const router = getRouter();
// Re-run route loaders/head functions on locale changes without changing the
// current match, so forms retain their local state while metadata refreshes.
subscribeLocale(() => {
  void router.invalidate();
});

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

createRoot(document.getElementById('root')!).render(
  <LocaleProvider>
    <RouterProvider router={router} />
  </LocaleProvider>,
);
