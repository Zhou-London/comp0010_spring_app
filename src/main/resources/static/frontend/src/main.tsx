import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import ModulesPage from "./pages/ModulesPage";
import GradesPage from "./pages/GradesPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import StateNotice from "./components/StateNotice";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "students", element: <StudentsPage /> },
      { path: "modules", element: <ModulesPage /> },
      { path: "grades", element: <GradesPage /> },
      { path: "registrations", element: <RegistrationsPage /> },
      {
        path: "*",
        element: (
          <div className="pt-10">
            <StateNotice title="Page not found" message="The requested view does not exist." tone="error" />
          </div>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
