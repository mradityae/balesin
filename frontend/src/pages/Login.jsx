import React, { useState } from "react";
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
      Swal.fire({ icon: "warning", text: "Email dan password wajib diisi" });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;

      setToken(token);

      const payload = jwtDecode(token); // Baca role dari token

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
          nav("/dashboard");
        }
      }, 1000);

    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "Email atau password salah",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 w-full max-w-md relative">

        <Link
          to="/"
          className="
            absolute -top-3 left-4
            bg-white px-3 py-1.5 rounded-full border
            text-xs font-medium text-slate-600
            hover:text-blue-600 transition
          "
        >
          ← Landing
        </Link>

        <h1 className="text-center text-gray-900 font-extrabold text-3xl mb-2 mt-4">
          Login
        </h1>

        <input
          className="w-full border px-4 py-3 mb-4 rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border px-4 py-3 mb-6 rounded-lg"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? "Memproses..." : "Login"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}
