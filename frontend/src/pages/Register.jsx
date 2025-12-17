import React from "react";
import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Oops",
        text: "Email dan password wajib diisi",
      });
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", { email, password });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Registrasi berhasil, silakan login",
        timer: 1500,
        showConfirmButton: true,
      });

      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Registrasi gagal, coba lagi";

      Swal.fire({
        icon: "error",
        title: "Register gagal",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border rounded-xl p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Register</h2>
          <p className="text-sm text-gray-500">
            Buat akun untuk mulai menggunakan WhatsApp Bot
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
