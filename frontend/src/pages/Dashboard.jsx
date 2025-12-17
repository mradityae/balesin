import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/Card";
import TopBar from "../components/TopBar";

export default function Dashboard() {
  const [bot, setBot] = useState(null);
  const [business, setBusiness] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const nav = useNavigate();

  const load = async () => {
    try {
      const [botRes, bizRes] = await Promise.all([
        api.get("/bot/status"),
        api.get("/business"),
      ]);

      setBot(botRes.data);
      setBusiness(bizRes.data); // null kalau belum ada
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(
        msg === "No subscription"
          ? "No subscription"
          : "Gagal memuat dashboard"
      );
    }
  };

  const startBot = async () => {
    try {
      setLoading(true);
      await api.post("/bot/start");
      await load();
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(
        msg === "No subscription"
          ? "No subscription"
          : "Gagal menjalankan bot"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!bot?.connected) {
      const t = setInterval(load, 3000);
      return () => clearInterval(t);
    }
  }, [bot?.connected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <TopBar
        title="WhatsApp Bot Dashboard"
        subtitle="Kelola koneksi WhatsApp bot kamu di sini"
        variant="user"
      />

      {/* ERROR */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
            ⚠️
            <div>
              {error === "No subscription" ? (
                <>
                  <p className="font-semibold">Akun belum aktif</p>
                  <p className="text-xs mt-1">
                    Silakan hubungi admin untuk mengaktifkan subscription.
                  </p>
                </>
              ) : (
                error
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS NOT SET */}
      {business === null && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 px-5 py-4 rounded-xl">
            <div>
              <p className="font-semibold text-yellow-800">
                Profil bisnis belum disiapkan
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Bot tidak akan membalas pesan sebelum profil bisnis diisi.
              </p>
            </div>

            <button
              onClick={() => nav("/setup-business")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              Setup Bisnis
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* STATUS BOT */}
        <Card title="Status Bot">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  bot?.connected
                    ? "bg-green-500 animate-pulse"
                    : "bg-yellow-400"
                }`}
              />
              <span className="font-medium text-slate-700">
                {bot?.connected ? "Connected" : "Not Connected"}
              </span>
            </div>

            {!bot?.connected ? (
              <button
                onClick={startBot}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-xl shadow disabled:opacity-60"
              >
                {loading ? "Connecting..." : "Connect WhatsApp"}
              </button>
            ) : (
              <button
                onClick={startBot}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-xl shadow disabled:opacity-60"
              >
                {loading ? "Restarting..." : "Restart Connection"}
              </button>
            )}
          </div>

          {bot?.connected && (
            <p className="text-xs text-slate-500 mt-4">
              Bot terhubung ke WhatsApp.
            </p>
          )}
        </Card>

        {/* BUSINESS SUMMARY */}
        {business && (
          <Card title="Profil Bisnis">
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <b>Nama:</b> {business.name}
              </p>
              <p>
                <b>Deskripsi:</b> {business.description}
              </p>
              <p>
                <b>Gaya Bicara:</b> {business.tone}
              </p>
              <p>
                <b>Produk:</b> {business.products?.length || 0}
              </p>
              <p>
                <b>FAQ:</b> {business.faq?.length || 0}
              </p>

              <button
                onClick={() => nav("/setup-business")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg"
              >
                Edit Profil Bisnis
              </button>
            </div>
          </Card>
        )}

        {/* QR */}
        {bot?.qr && (
          <Card title="Scan QR Code">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow">
                <img src={bot.qr} alt="QR" className="w-56 h-56" />
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                WhatsApp → Linked Devices → Scan QR
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
