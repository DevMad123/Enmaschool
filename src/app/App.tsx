// ===== src/app/App.tsx =====

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { routes } from '@/app/routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
