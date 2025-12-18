import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SetupBusiness from "./pages/SetupBusiness";
import Landing from "./pages/Landing";
import ApiConfig from "./pages/ApiConfig";

import { getToken } from "./utils/auth";
import { jwtDecode } from "jwt-decode";

// ===== PUBLIC BLOCKER =====
const Public = ({ children }) => {
  const token = getToken();
  if (!token) return children;
  return <Navigate to="/dashboard" replace />;
};

// =============== PRIVATE WRAPPER ===================
const Private = ({ children, admin }) => {
  const token = getToken();

  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = jwtDecode(token);

    if (admin && payload.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
};

// =================== ROUTER ========================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC LANDING (auto redirect kalau sudah login) */}
        <Route
          path="/"
          element={
            <Public>
              <Landing />
            </Public>
          }
        />

        {/* AUTH */}
        <Route
          path="/login"
          element={
            <Public>
              <Login />
            </Public>
          }
        />

        <Route
          path="/register"
          element={
            <Public>
              <Register />
            </Public>
          }
        />

        {/* USER AREA */}
        <Route
          path="/dashboard"
          element={
            <Private>
              <Dashboard />
            </Private>
          }
        />

        <Route
          path="/setup-business"
          element={
            <Private>
              <SetupBusiness />
            </Private>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/api-config"
          element={
            <Private>
              <ApiConfig />
            </Private>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <Private admin>
              <Admin />
            </Private>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center text-xl text-slate-700">
              404 – Page Not Found
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
