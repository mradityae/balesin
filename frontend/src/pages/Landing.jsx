import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, ArrowRight, Zap, Check, 
  Shield, Sparkles, Receipt, MessageSquare, TrendingUp, Clock, Smartphone, RefreshCw
} from "lucide-react";
import api from "../services/api";

export default function Landing() {
  const [pricing, setPricing] = useState({
    pricePerDay: 2000,
    priceMonthly: 60000,
    oldPrice: "250k",
    activePromoText: "Otomatis Whitelist WA"
  });
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    const targets = document.querySelectorAll(".scroll-fade");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    }, { threshold: 0.1 });
    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    api.get("/settings/pricing")
      .then(res => {
        if (res?.data) {
          setPricing({
            pricePerDay: res.data.pricePerDay || 2000,
            priceMonthly: res.data.priceMonthly || 60000,
            oldPrice: res.data.oldPrice || "250k",
            activePromoText: res.data.activePromoText || "Otomatis Whitelist WA"
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPricing(false));
  }, []);

  return (
    <div className="bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 min-h-screen">
      
      {/* GLOW EFFECT BACKGROUND */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[120px]"></div>
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-teal-600 rounded-full blur-[100px]"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md bg-[#020617]/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Bot className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-white">Keuangan AI</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition">Login</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-full bg-emerald-500 text-slate-950 text-sm font-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20">Mulai Sekarang</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8">
            <Sparkles size={14} /> Otomatisasi Catatan Keuangan WhatsApp
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-8">
            Catat Keuangan untuk <br />Wanita Cerdas <br /> 
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent italic">Cukup Lewat WhatsApp</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Kirim teks transaksi atau foto struk belanjaan langsung ke nomor WhatsApp Bot. AI akan mencatat, mengelompokkan, dan menampilkan laporan keuangan real-time di dashboard web Anda.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-500 transition shadow-xl shadow-emerald-600/20 active:scale-95">
              Gunakan Asisten Keuangan anda Sekarang <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 w-fit mb-5">
              <MessageSquare size={26} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Catat via Chat & Struk</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Cukup ketik pesan singkat atau kirim foto nota/struk belanja. AI secara cerdas mengurai nama barang, harga, dan jenis transaksi.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 w-fit mb-5">
              <Smartphone size={26} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Tanpa Scan QR Kode</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Satu kali mendaftar, nomor WhatsApp Anda langsung ter-whitelist secara otomatis di server tanpa perlu repot melakukan scan QR.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 w-fit mb-5">
              <TrendingUp size={26} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Dashboard Real-time</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Pantau total pemasukan, pengeluaran, serta riwayat transaksi dengan pembaruan otomatis (live sync) setiap ada pesan masuk.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="harga" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">Investasi Sangat Hemat</h2>
            <p className="text-slate-400 text-sm font-medium">Satu paket lengkap untuk memantau pencatatan keuangan bisnis Anda 24/7.</p>
          </div>

          {/* SINGLE PAKET KEUANGAN AI */}
          <div className="bg-gradient-to-b from-slate-900 to-[#020617] border-2 border-emerald-500 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden max-w-xl mx-auto">
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 px-6 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-widest">
              Best Deal
            </div>

            <div className="mb-6">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-500/20 tracking-wider">
                {pricing.activePromoText}
              </span>
              <h3 className="text-3xl font-black text-white mt-3 uppercase tracking-tight">Paket Keuangan AI</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Solusi praktis pencatatan keuangan tanpa ribet.</p>
            </div>

            {loadingPricing ? (
              <div className="py-12 flex justify-center items-center text-slate-400 text-xs gap-2">
                <RefreshCw className="animate-spin text-emerald-400" size={18} /> Memuat harga terbaru...
              </div>
            ) : (
              <>
                <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm text-slate-500 line-through font-bold block">Rp {pricing.oldPrice} / bln</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400">
                        Rp {Number(pricing.priceMonthly).toLocaleString('id-ID')}
                      </span>
                      <span className="text-slate-400 text-xs font-bold"> / bulan</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                      ~Rp {Number(pricing.pricePerDay).toLocaleString('id-ID')} / hari
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Otomatis Whitelist Nomor WA dari Profil",
                    "Pencatatan Otomatis dari Chat WhatsApp",
                    "Pencatatan Otomatis dari Foto Struk / Nota",
                    "Cek Laporan & Riwayat Keuangan via WA",
                    "Hapus/Batal Transaksi Langsung via WA",
                    "Dashboard Analisis & Grafik Keuangan Web Real-time"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-xs md:text-sm text-slate-200 font-bold">
                      <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  to="/register" 
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-center font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-95"
                >
                  Berlangganan Sekarang <ArrowRight size={18} />
                </Link>
              </>
            )}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-white/5 text-center text-xs text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} Keuangan AI. All Rights Reserved.</p>
      </footer>

    </div>
  );
}