// Purpose: Shared layout with navbar + sidebar.

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-100 opacity-60 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-100 opacity-60 blur-[120px]" />
      </div>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <div className={`${collapsed ? "lg:w-20" : "lg:w-72"} hidden transition-all duration-300 lg:block`}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
