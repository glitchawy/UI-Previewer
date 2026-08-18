import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { getToken } from './lib/auth-session';
import './index.css';

// Automatically attach the session Bearer token to every API request
setAuthTokenGetter(getToken);

const router = getRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
