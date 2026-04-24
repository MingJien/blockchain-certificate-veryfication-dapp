// Purpose: Small reusable button component.

import React from "react";

export default function Button({ variant = "primary", children, ...props }) {
  const className = variant === "secondary"
    ? "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    : "btn-primary";
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
