// Purpose: App routing (react-router).

import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import RequireAuth from "./components/RequireAuth";
import RoleGuard from "./components/RoleGuard";

import Home from "./pages/Home";
import IssuerDashboard from "./pages/IssuerDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import VerifyPage from "./pages/VerifyPage";
import QRVerifyPage from "./pages/QRVerifyPage";
import CertificateDetail from "./pages/CertificateDetail";
import LoginPage from "./pages/Login";
import AdminIssuerManagement from "./pages/AdminIssuerManagement";
import AdminHolderManagement from "./pages/AdminOwnerManagement";

const router = createBrowserRouter([
  {
    path: "/verify/:id",
    element: <CertificateDetail />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      {
        path: "issuer",
        element: (
          <RoleGuard roles={["ADMIN", "ISSUER"]}>
            <IssuerDashboard />
          </RoleGuard>
        )
      },
      {
        path: "student",
        element: (
          <RoleGuard roles={["ADMIN", "ISSUER", "STUDENT", "HOLDER"]}>
            <StudentDashboard />
          </RoleGuard>
        )
      },
      {
        path: "verify",
        element: (
          <RoleGuard roles={["ADMIN", "ISSUER", "STUDENT", "HOLDER"]}>
            <VerifyPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/issuers",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <AdminIssuerManagement />
          </RoleGuard>
        )
      },
      {
        path: "admin/holders",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <AdminHolderManagement />
          </RoleGuard>
        )
      },
      {
        path: "qr-verify",
        element: (
          <RoleGuard roles={["ADMIN", "ISSUER", "STUDENT", "HOLDER"]}>
            <QRVerifyPage />
          </RoleGuard>
        )
      }
    ]
  }
]);

export default router;
