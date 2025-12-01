import React, { Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

const App = React.lazy(() => import('../App'));
const Home = React.lazy(() => import('../pages/Home'));
const Explorer = React.lazy(() => import('../pages/Explorer'));
const Profile = React.lazy(() => import('../pages/Profile'));

const Loading = () => <div className="p-6 text-center text-slate-200">Loading...</div>;

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'explorer',
        element: (
          <Suspense fallback={<Loading />}>
            <Explorer />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<Loading />}>
            <Profile />
          </Suspense>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
