import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SetupBusiness from "./pages/SetupBusiness";
import ApiConfig from "./pages/ApiConfig";
import { getToken } from "./utils/auth";
import { jwtDecode } from "jwt-decode";

const RootRedirect = () => {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = jwtDecode(token);

    if (payload.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  } catch (e) {
    // token rusak / expired
    return <Navigate to="/login" replace />;
  }
};

const Private = ({ children }) =>
  getToken() ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROOT SMART REDIRECT */}
        <Route path="/" element={<RootRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <Private>
              <Dashboard />
            </Private>
          }
        />

        <Route path="/api-config" element={<ApiConfig />} />

        <Route
          path="/admin"
          element={
            <Private>
              <Admin />
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
      </Routes>
    </BrowserRouter>
  );
}
