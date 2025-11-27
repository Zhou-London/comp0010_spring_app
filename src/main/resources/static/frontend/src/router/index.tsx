import React, { Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

const App = React.lazy(() => import('../App'));
const Home = React.lazy(() => import('../pages/Home'));
const Students = React.lazy(() => import('../pages/Students'));
const Modules = React.lazy(() => import('../pages/Modules'));
const Grades = React.lazy(() => import('../pages/Grades'));
const Registrations = React.lazy(() => import('../pages/Registrations'));
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
        path: 'students',
        element: (
          <Suspense fallback={<Loading />}>
            <Students />
          </Suspense>
        ),
      },
      {
        path: 'modules',
        element: (
          <Suspense fallback={<Loading />}>
            <Modules />
          </Suspense>
        ),
      },
      {
        path: 'grades',
        element: (
          <Suspense fallback={<Loading />}>
            <Grades />
          </Suspense>
        ),
      },
      {
        path: 'registrations',
        element: (
          <Suspense fallback={<Loading />}>
            <Registrations />
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
