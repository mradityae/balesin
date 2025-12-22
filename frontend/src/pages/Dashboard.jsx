import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/Card";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const [bot, setBot] = useState(null);
  const [business, setBusiness] = useState(undefined);

  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState(null);

  const [wasConnected, setWasConnected] = useState(false);

  const qrRef = useRef(null);
  const topRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      nav("/login");
      return;
    }

    try {
      const data = jwtDecode(token);
      setUserEmail(data.email);
      setUserRole(data.role);
    } catch {
      nav("/login");
    }

  }, []);

  const load = async () => {
    try {
      const [botRes, bizRes] = await Promise.all([
        api.get("/bot/status"),
        api.get("/business"),
      ]);

      setBot(botRes.data);
      setBusiness(bizRes.data);
      setError(null);

      if (botRes.data?.qr) {
        setQrLoading(false);
      }

    } catch (err) {
      const msg = err.response?.data?.error;

      if (msg === "No subscription") {
        Swal.fire({
          icon: "warning",
          title: "Akun belum aktif",
          text: "Silakan hubungi admin.",
        });
        setError(null);
        return;
      }

      setError("Gagal memuat dashboard");
    }
  };

  const startBot = async (isRestart = false) => {
    try {
      setLoading(true);

      if (!isRestart) {
        setQrLoading(true);
        setBot(b => (b ? { ...b, qr: null } : null));
      }

      await api.post("/bot/start");
      await load();

      if (!isRestart) {
        setTimeout(() => {
          qrRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }

    } catch (err) {
      const msg = err.response?.data?.error;

      if (msg === "No subscription") {
        Swal.fire({
          icon: "warning",
          title: "Akun belum aktif",
          text: "Silakan hubungi admin.",
        });
        setQrLoading(false);
        setLoading(false);
        return;
      }

      setError(isRestart ? "Gagal restart bot" : "Gagal menjalankan bot");

    } finally {
      setLoading(false);

      if (isRestart) {
        setQrLoading(false);
      }
    }
  };

  useEffect(() => {
    load();

    if (!bot?.connected) {
      const t = setInterval(load, 3000);
      return () => clearInterval(t);
    }

  }, [bot?.connected]);

  useEffect(() => {
    if (bot?.connected && !wasConnected) {
      setWasConnected(true);

      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

      setQrLoading(false);
    }

    if (!bot?.connected) {
      setWasConnected(false);
    }
  }, [bot?.connected]);

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-gray-50 p-6 md:p-10"
    >

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10">
        <TopBar
          title="WhatsApp Bot Dashboard"
          subtitle="Kelola koneksi WhatsApp bot kamu di sini"
          variant="user"
        />

        {/* USER INFO */}
        <div className="bg-white shadow border rounded-2xl p-5 flex justify-between items-center mt-6">
          <div className="">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-semibold text-gray-700">{userEmail}</p>
          </div>

          <span
            className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              userRole === "admin"
                ? "bg-blue-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {userRole}
          </span>
        </div>
      </div>

      {/* BUSINESS ALERT */}
      {business === null && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-5 shadow flex justify-between items-center">
            <div>
              <p className="font-bold text-yellow-800">
                Profil bisnis belum disiapkan
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Bot tidak akan membalas pesan sebelum profil bisnis diisi.
              </p>
            </div>

            <button
              onClick={() => nav("/setup-business")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-4 py-2 rounded-lg"
            >
              Setup sekarang
            </button>
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* BOT STATUS */}
        <div className="bg-white border rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">
            Status Bot
          </h3>

          <div className="flex items-center justify-between">

            <div className="flex gap-3 items-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  bot?.connected
                    ? "bg-green-500 animate-pulse"
                    : "bg-yellow-500"
                }`}
              />
              <span className="font-medium text-gray-600">
                {bot?.connected ? "Connected" : "Not Connected"}
              </span>
            </div>

            <button
              onClick={() => {
                if (bot?.connected) startBot(true);
                else startBot(false);
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-xl shadow disabled:opacity-50"
            >
              {loading
                ? "Working..."
                : bot?.connected
                ? "Restart"
                : "Connect WhatsApp"}
            </button>

          </div>
        </div>

        {/* BUSINESS */}
        {business && (
          <div className="bg-white border rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold mb-4">
              Profil Bisnis
            </h3>

            <div className="space-y-2 text-sm text-gray-700">
              <p><b>Nama:</b> {business.name}</p>

              <div>
                <b>Deskripsi:</b>
                <div className="max-h-40 overflow-y-auto whitespace-pre-line text-xs mt-2 bg-gray-50 p-2 rounded-lg border">
                  {business.description}
                </div>
              </div>

              <p><b>Gaya Bicara:</b> {business.tone}</p>
              <p><b>Produk:</b> {business.products?.length || 0}</p>
              <p><b>FAQ:</b> {business.faq?.length || 0}</p>

              <button
                onClick={() => nav("/setup-business")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg"
              >
                Edit Profil Bisnis
              </button>
            </div>
          </div>
        )}

        {/* QR */}
        <div className="md:col-span-2 bg-white border rounded-2xl shadow p-10 flex flex-col items-center">

          {qrLoading && !bot?.qr && !bot?.connected && (
            <>
              <div className="w-14 h-14 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 mt-3">Menyiapkan QR...</p>
            </>
          )}

          {bot?.qr && !bot?.connected && (
            <div className="bg-gray-100 p-4 rounded-xl shadow">
              <img src={bot.qr} alt="QR" className="w-56 h-56 rounded-lg" />
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            WhatsApp → Linked Devices → Scan QR
          </p>
        </div>

      </div>

    </div>
  );
}
