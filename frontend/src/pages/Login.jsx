import React from "react";
import { useState } from "react";
import api from "../services/api";
import { setToken } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        text: "Email dan password wajib diisi",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;

      setToken(token);

      const payload = jwtDecode(token);

      Swal.fire({
        icon: "success",
        text: "Login berhasil",
        timer: 1000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        if (payload.role === "admin") {
          nav("/admin");
        } else {
          nav("/");
        }
      }, 1000);
    } catch (err) {
      // ❌ unauthorized
      if (err.response?.status === 401) {
        Swal.fire({
          icon: "error",
          text: "Email atau password salah",
        });
        return;
      }

      // ❌ fallback error
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Terjadi kesalahan, silakan coba lagi";

      Swal.fire({
        icon: "error",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login Dashboard
        </h1>

        <input
          className="w-full border rounded-lg px-4 py-2 mb-4"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-lg px-4 py-2 mb-6"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
