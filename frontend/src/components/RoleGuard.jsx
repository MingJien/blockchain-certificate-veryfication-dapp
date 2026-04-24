import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteByRole, normalizeRole } from "../utils/role";

export default function RoleGuard({ roles = [], children }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const allowed = roles.map((item) => normalizeRole(item));

  if (!allowed.includes(role)) {
    return <Navigate to={getDefaultRouteByRole(role)} replace />;
  }

  return children;
}
