// Purpose: Simple sidebar navigation.

import React from "react";
import { NavLink } from "react-router-dom";
import {
  Grid2x2,
  ShieldCheck,
  GraduationCap,
  SearchCheck,
  QrCode,
  UserCog,
  Users,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/role";

const navItems = [
  { to: "/", label: "Tổng Quan", icon: Grid2x2, roles: ["ADMIN", "ISSUER", "STUDENT", "HOLDER"] },
  { to: "/issuer", label: "Cấp Chứng Chỉ", icon: GraduationCap, roles: ["ADMIN", "ISSUER"] },
  { to: "/student", label: "Tra Cứu Chứng Chỉ", icon: ShieldCheck, roles: ["ADMIN", "ISSUER", "STUDENT", "HOLDER"] },
  { to: "/verify", label: "Xác Minh Chứng Chỉ", icon: SearchCheck, roles: ["ADMIN", "ISSUER", "STUDENT", "HOLDER"] },
  { to: "/qr-verify", label: "Xác Minh QR", icon: QrCode, roles: ["ADMIN", "ISSUER", "STUDENT", "HOLDER"] },
  { to: "/admin/issuers", label: "Quản Lý Issuer", icon: UserCog, roles: ["ADMIN"] },
  { to: "/admin/holders", label: "Quản Lý Holder", icon: Users, roles: ["ADMIN"] }
];

function linkClass(isActive, collapsed) {
  return `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
    collapsed ? "justify-center px-2" : ""
  } ${
    isActive
      ? "bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_10px_20px_-12px_rgba(59,130,246,0.45)]"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-700"
  }`;
}

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_20px_25px_-5px_rgba(0,0,0,0.03)] ring-1 ring-black/5">
      {!collapsed ? (
        <div className="px-3 pb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Điều Hướng</p>
          <p className="mt-1 text-xs text-slate-400">Quản lý chứng chỉ nhanh</p>
        </div>
      ) : null}
      <div className="mt-1 flex-1 space-y-1.5">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive, collapsed)}>
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute left-0 h-6 w-1 rounded-r-full bg-blue-500" /> : null}
                  <Icon className="h-4 w-4" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        className={`mt-3 inline-flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {!collapsed ? <span>Thu gọn</span> : null}
      </button>
    </div>
  );
}
