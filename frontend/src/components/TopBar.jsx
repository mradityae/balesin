import React from "react";
import { logout } from "../utils/auth";

export default function TopBar({
  title,
  subtitle,
  variant = "user", // "user" | "admin"
}) {
  const handleLogout = () => {
    logout();
    location.href = "/login";
  };

  return (
    <div className="max-w-6xl mx-auto flex items-center justify-between mb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* LOGOUT */}
      {variant === "admin" ? (
        /* ADMIN STYLE */
        <button
          onClick={handleLogout}
          className="
            px-4 py-2
            text-sm font-semibold
            text-white
            bg-red-600
            rounded-xl
            hover:bg-red-700
            shadow
            transition
          "
        >
          Logout
        </button>
      ) : (
        /* USER STYLE */
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-2
            px-4 py-2
            text-sm font-medium
            text-red-600
            border border-red-200
            rounded-xl
            hover:bg-red-50 hover:border-red-300
            transition
          "
        >
          <span className="text-base">⏻</span>
          Logout
        </button>
      )}
    </div>
  );
}
