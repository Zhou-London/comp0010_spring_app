import React, { Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

const App = React.lazy(() => import('../App'));
const Home = React.lazy(() => import('../pages/Home'));
const Students = React.lazy(() => import('../pages/Students'));
const Modules = React.lazy(() => import('../pages/Modules'));
const History = React.lazy(() => import('../pages/History'));
const Api = React.lazy(() => import('../pages/Api'));
const StudentDetail = React.lazy(() => import('../pages/StudentDetail'));
const ModuleDetail = React.lazy(() => import('../pages/ModuleDetail'));

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
        path: 'history',
        element: (
          <Suspense fallback={<Loading />}>
            <History />
          </Suspense>
        ),
      },
      {
        path: 'doc-api',
        element: (
          <Suspense fallback={<Loading />}>
            <Api />
          </Suspense>
        ),
      },
      {
        path: 'students/:studentId/:section?',
        element: (
          <Suspense fallback={<Loading />}>
            <StudentDetail />
          </Suspense>
        ),
      },
      {
        path: 'modules/:moduleId/:section?',
        element: (
          <Suspense fallback={<Loading />}>
            <ModuleDetail />
          </Suspense>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
