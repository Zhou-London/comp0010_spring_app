import React, { Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

const Home = React.lazy(() => import('../pages/Home'));
const Loading = () => <div className="p-4 text-center">Loading...</div>;

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <Home />
      </Suspense>
    ),
  },
];

const router = createBrowserRouter(routes);

export default router;