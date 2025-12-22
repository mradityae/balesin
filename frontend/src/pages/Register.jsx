import React, { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Swal.fire({ icon: "warning", text: "Semua field wajib diisi!" });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({ icon: "warning", text: "Password tidak sama!" });
      return;
    }

    if (!captcha) {
      Swal.fire({ icon: "warning", text: "Captcha wajib dicentang!" });
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
        captcha
      });

      Swal.fire({
        icon: "success",
        text: "Registrasi berhasil!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => nav("/login"), 1500);

    } catch (err) {
      Swal.fire({
        icon: "error",
        text: err.response?.data?.error || "Registrasi gagal",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white border rounded-xl shadow-lg p-8 w-full max-w-md relative">

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
          Register
        </h1>

        <input
          className="w-full border px-4 py-3 mb-4 rounded-lg"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border px-4 py-3 mb-4 rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border px-4 py-3 mb-4 rounded-lg"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="w-full border px-4 py-3 mb-4 rounded-lg"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="mb-4 flex justify-center">
          <ReCAPTCHA
            sitekey="6LdqUTMsAAAAABl_OU6YkHVToIvsJe2eA0_oY2Vf"
            onChange={setCaptcha}
          />
        </div>

        <button
          onClick={submit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Loading..." : "Register"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
