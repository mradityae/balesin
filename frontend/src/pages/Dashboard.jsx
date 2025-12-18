import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/Card";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";

export default function Dashboard() {
  const [bot, setBot] = useState(null);
  const [business, setBusiness] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState(null);

  const [wasConnected, setWasConnected] = useState(false);

  const qrRef = useRef(null);
  const topRef = useRef(null);
  const nav = useNavigate();

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

  // MASTER start & restart function
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

      // restart mode → tidak paksa qr keluar
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
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10"
    >
      <TopBar
        title="WhatsApp Bot Dashboard"
        subtitle="Kelola koneksi WhatsApp bot kamu di sini"
        variant="user"
      />

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

            <button
              onClick={() => {
                if (bot?.connected) startBot(true);
                else startBot(false);
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-xl shadow disabled:opacity-60"
            >
              {loading
                ? "Working..."
                : bot?.connected
                ? "Restart"
                : "Connect WhatsApp"}
            </button>
          </div>
        </Card>

        {business && (
          <Card title="Profil Bisnis">
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <b>Nama:</b> {business.name}
              </p>

              <div className="flex flex-col">
                <b>Deskripsi:</b>
                <div className="max-h-40 overflow-y-auto pr-1 whitespace-pre-line text-sm text-slate-700 text-justify leading-relaxed">
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
          </Card>
        )}

        <Card title="Scan QR Code">
          <div
            ref={qrRef}
            className="flex flex-col items-center justify-center min-h-[300px]"
          >

            {qrLoading && !bot?.qr && !bot?.connected && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 mt-3">
                  Menyiapkan QR...
                </p>
              </div>
            )}

            {bot?.qr && !bot?.connected && (
              <div className="bg-white p-4 rounded-2xl shadow">
                <img src={bot.qr} alt="QR" className="w-56 h-56" />
              </div>
            )}

            <p className="text-xs text-slate-500 text-center mt-4">
              WhatsApp → Linked Devices → Scan QR
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
