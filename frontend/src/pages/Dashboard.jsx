import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";
import { 
  QrCode, RefreshCw, 
  CheckCircle2, AlertCircle, 
  User, Bot, Zap, ArrowRight,
  LayoutDashboard, Clock, ShieldCheck, Edit3, X, MessageCircle
} from "lucide-react";

export default function Dashboard() {
  const [bot, setBot] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [subscribeUntil, setSubscribeUntil] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wasConnected, setWasConnected] = useState(false);

  // State untuk Modal Edit Profil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // --- PAKET KEUANGAN AI (Dinamis Berbasis Hari) ---
  const [financePlan, setFinancePlan] = useState({
    id: 'finance',
    name: 'Keuangan AI',
    pricePerDay: 2000,
    oldPrice: '250k',
    activePromoText: 'Otomatis Whitelist WA',
    features: [
      'Otomatis Whitelist Nomor WA Anda dari Akun Profile',
      'Pencatatan Otomatis dari Chat & Struk Foto',
      'Manajemen Whitelist Tambahan (Kasir/Pengurus)',
      'Cek Laporan & Riwayat Keuangan via WA',
      'Hapus/Batal Transaksi Langsung via WA',
      'Dashboard Analisis & Grafik Keuangan Web'
    ]
  });

  const [daysCount, setDaysCount] = useState(1);

  const qrRef = useRef(null);
  const topRef = useRef(null);
  const nav = useNavigate();

  // Ambil konfigurasi pricing dari backend
  useEffect(() => {
    api.get("/settings/pricing")
      .then(res => {
        if (res?.data) {
          setFinancePlan(prev => ({
            ...prev,
            pricePerDay: res.data.pricePerDay || 2000,
            oldPrice: res.data.oldPrice || '250k',
            activePromoText: res.data.activePromoText || 'Otomatis Whitelist WA'
          }));
        }
      })
      .catch(() => console.log("Menggunakan default pricing dashboard"));
  }, []);

  const handleAdminConnect = async () => {
    try {
      setLoading(true);
      if (!bot?.connected) {
        setQrLoading(true);
        setBot(b => (b ? { ...b, qr: null } : null));
      }
      await api.post("/bot/start");
      await load();
      if (!bot?.connected) {
        setTimeout(() => { qrRef.current?.scrollIntoView({ behavior: "smooth" }); }, 200);
      }
    } catch (err) {
      setError("Gagal menghubungkan engine bot");
    } finally {
      setLoading(false);
      setQrLoading(false);
    }
  };

  const calculateTotal = () => {
    const basePrice = financePlan.pricePerDay * daysCount;
    if (daysCount >= 30) {
      const discount = basePrice * 0.10;
      return Math.round(basePrice - discount);
    }
    return basePrice;
  };

  const loadUserData = async () => {
    const token = getToken();
    if (!token) { nav("/login"); return; }
    try {
      const decoded = jwtDecode(token);      
      const userId = decoded.uid || decoded.id;
      const roleVal = decoded.role || "";
      setUserRole(roleVal);

      let subscribedUntilVal = decoded.subscribedUntil || "";
      let nameVal = decoded.name || decoded.nama || "";
      let emailVal = decoded.email || "";
      let phoneVal = decoded.phone || "";

      if (userId) {
        try {
          const res = await api.get(`/admin/user/${userId}`);
          const userData = res.data?.user || res.data;
          
          nameVal = userData.name || userData.nama || nameVal;
          emailVal = userData.email || emailVal;
          phoneVal = userData.phone || phoneVal;
          subscribedUntilVal = userData.subscribedUntil || userData.subscribeUntil || subscribedUntilVal;
        } catch (apiErr) {
          console.log("Gagal fetch dari API user ID, fallback ke token decode:", apiErr);
        }
      }

      setUserEmail(emailVal);
      setUserName(nameVal);
      setUserPhone(phoneVal);
      setSubscribeUntil(subscribedUntilVal);

      setEditName(nameVal);
      setEditEmail(emailVal);
      setEditPhone(phoneVal);

      // --- CEK APAKAH SISA WAKTU KURANG DARI 12 JAM & NOTIFIKASI ---
      if (roleVal !== "admin" && subscribedUntilVal) {
        const now = new Date();
        const expiryDate = new Date(subscribedUntilVal);
        const diffMs = expiryDate - now;
        const twelveHoursInMs = 12 * 60 * 60 * 1000;

        if (diffMs > 0 && diffMs <= twelveHoursInMs) {
          setIsExpiringSoon(true);
          const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
          Swal.fire({
            icon: "warning",
            title: "Masa Aktif Segera Habis!",
            text: `Langganan Keuangan AI Anda akan berakhir dalam kurang lebih ${hoursLeft} jam lagi. Silakan lakukan perpanjangan pada menu di bawah.`,
            confirmButtonText: "Baiklah",
            confirmButtonColor: "#059669"
          });
        } else {
          setIsExpiringSoon(false);
        }
      }

    } catch { 
      nav("/login"); 
    }
  };

  useEffect(() => {
    loadUserData();
  }, [nav]);

  const loadPayment = async () => {
    if (userRole === "admin") return; 
    try {
      const res = await api.get("/payment-proof/status");
      setPaymentStatus(res.data.status);
      setPaymentData(res.data);
    } catch { setPaymentStatus("not_found"); }
  };

  const load = async () => {
    try {
      const botRes = await api.get("/bot/status");
      setBot(botRes.data);
      setError(null);
      if (botRes.data?.qr) setQrLoading(false);
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg === "No subscription" && userRole !== "admin") {
        setError(null);
        return;
      }
      setError("Gagal memuat dashboard");
    }
  };

  useEffect(() => {
    load();
    loadPayment();

    const interval = setInterval(() => {
      loadUserData();
      loadPayment();
      if (userRole === "admin" && !bot?.connected) {
        load();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [userRole, bot?.connected]);

  useEffect(() => {
    if (bot?.connected && !wasConnected) {
      setWasConnected(true);
      setTimeout(() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }, 200);
      setQrLoading(false);
    }
    if (!bot?.connected) setWasConnected(false);
  }, [bot?.connected]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const payload = userRole === "admin" 
        ? { email: editEmail } 
        : { name: editName, email: editEmail, phone: editPhone }; 

      const res = await api.put("/auth/profile", payload);
      
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Profil Anda berhasil diperbarui.",
        timer: 2000,
        showConfirmButton: false
      });

      setIsEditModalOpen(false);
      loadUserData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat memperbarui profil."
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const formatPhone = (jid) => {
    if (!jid) return null;
    const number = jid.split(":")[0].split("@")[0];
    return "+" + number;
  };

  const getRemainingDays = () => {
    if (!subscribeUntil) return 0;
    
    const now = new Date();
    const expiryDate = new Date(subscribeUntil);
    const diffTime = expiryDate - now;
    
    if (diffTime <= 0) return 0;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div ref={topRef} className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 pb-20 relative">
      
      {/* HEADER AREA */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <TopBar
            title="Keuangan AI Console"
            subtitle="Pusat Kendali Automasi Catatan Keuangan WhatsApp"
            variant="user"
          />
          
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 text-emerald-600">
                <User size={18} />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Akun Terdaftar</p>
                <p className="font-bold text-slate-700 text-sm">
                  {userName || userEmail} {userPhone && <span className="text-emerald-600 font-extrabold ml-1">({userPhone})</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {paymentStatus === "approved" && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-emerald-800 text-xs font-bold">
                  <Clock size={15} className="text-emerald-600" />
                  <span>Sisa Masa Aktif: <strong className="text-emerald-700">{getRemainingDays()} Hari</strong></span>
                </div>
              )}

              <button 
                onClick={() => {
                  setEditName(userName);
                  setEditEmail(userEmail);
                  setEditPhone(userPhone);
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Edit3 size={14} /> Edit Profil
              </button>

              {(userRole === "admin" || paymentStatus === "approved") && (
                <button 
                  onClick={() => nav("/finance")}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Zap size={14} /> Buka Halaman Finance
                </button>
              )}

              {userRole === "admin" && (
                <button 
                  onClick={() => nav("/admin")}
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                >
                  <LayoutDashboard size={14} /> Admin Panel
                </button>
              )}
              
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                userRole === "admin" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {userRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        
        {userRole !== "admin" && paymentStatus !== "approved" && (
          <div className="mb-8 space-y-6 max-w-2xl mx-auto">
            {paymentStatus === "pending" && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-[1.5rem] flex items-center gap-4 animate-pulse">
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><RefreshCw size={20} className="animate-spin" /></div>
                <div>
                  <p className="font-black text-amber-900 text-[10px] uppercase tracking-widest">Verifikasi Berjalan</p>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">Admin sedang meninjau pembayaran Anda. Begitu disetujui, nomor {userPhone || "Anda"} otomatis terhubung ke sistem.</p>
                </div>
              </div>
            )}

            {paymentStatus === "rejected" && (
              <div className="bg-white border-2 border-red-50 p-5 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border-l-4 border-l-red-500">
                <div className="flex items-center gap-4">
                  <AlertCircle className="text-red-500" size={24} />
                  <div>
                    <p className="font-black text-red-900 text-[10px] uppercase tracking-widest">Pembayaran Ditolak</p>
                    <p className="text-xs text-red-700 font-medium">Bukti transfer tidak valid. Silakan upload ulang bukti pembayaran.</p>
                  </div>
                </div>
              </div>
            )}

            {(paymentStatus === "not_found" || paymentStatus === "expired" || paymentStatus === "rejected") && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                  
                  <div className="bg-emerald-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full w-fit mb-4 tracking-widest shadow-md">
                    {financePlan.activePromoText}
                  </div>

                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Keuangan AI Bot</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Satu kali subscribe, nomor HP akun Anda langsung otomatis terdaftar ke Admin Finance.</p>

                  <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 line-through font-bold block">Rp {financePlan.oldPrice}</span>
                      <p className="text-3xl font-black text-emerald-600">
                        Rp {Number(financePlan.pricePerDay).toLocaleString('id-ID')}
                        <span className="text-xs text-slate-400 font-bold"> /hari</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                        Fleksibel Harian / Bulanan
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {financePlan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Durasi Berlangganan (Hari):</span>
                      <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-xl border border-white/10">
                        <button onClick={() => setDaysCount(Math.max(1, daysCount - 1))} className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center font-bold text-lg">-</button>
                        <span className="font-black text-sm w-16 text-center">{daysCount} Hari</span>
                        <button onClick={() => setDaysCount(daysCount + 1)} className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center font-bold text-lg">+</button>
                      </div>
                    </div>

                    {daysCount >= 30 && (
                      <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl text-center border border-emerald-500/20">
                        🎉 Selamat! Otomatis mendapat diskon 10% karena berlangganan &ge; 30 hari.
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Investasi:</span>
                      <span className="text-2xl font-black text-emerald-400">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                    </div>

                    <button 
                      onClick={() => nav("/payment-proof", { state: { plan: financePlan, total: calculateTotal(), duration: daysCount } })}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mt-4"
                    >
                      Aktifkan Keuangan AI Sekarang <ArrowRight size={18} />
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {userRole !== "admin" && paymentStatus === "approved" && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-10 shadow-xl shadow-emerald-500/5 relative overflow-hidden text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheck size={44} />
              </div>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">
                Langganan Aktif
              </span>

              <h2 className="text-3xl font-black text-slate-800 mt-4 tracking-tight uppercase">
                Nomor Terdaftar di Admin Finance
              </h2>
              
              <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto font-medium">
                Nomor WA <strong className="text-slate-800 font-bold">{userPhone || userEmail}</strong> telah otomatis di-whitelist oleh sistem. Anda dapat langsung mengirim pesan catatan transaksi ke WhatsApp Bot.
              </p>

              {/* KOTAK INFORMASI NOMOR AI */}
              <div className="mt-6 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Nomor WhatsApp Bot AI</p>
                    <p className="text-base font-black text-slate-900 tracking-wide mt-0.5">0831-9684-5145</p>
                  </div>
                </div>
                <a 
                  href="https://wa.me/6283196845145" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all shrink-0 flex items-center gap-1.5"
                >
                  Chat Bot <ArrowRight size={14} />
                </a>
              </div>

              {/* KELOLA LAPORAN & TOMBOL PERPANJANG HANYA MUNCUL JIKA < 12 JAM */}
              <div className="mt-6 p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Akses</p>
                    <p className="text-sm font-black text-emerald-600 flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      TERHUBUNG OTOMATIS
                    </p>
                  </div>
                  <button
                    onClick={() => nav("/finance")}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                  >
                    <Zap size={16} /> Kelola Laporan
                  </button>
                </div>

                {/* Bagian Perpanjangan (Aktif hanya jika sisa waktu <= 12 jam) */}
                {isExpiringSoon && (
                  <div className="pt-4 border-t border-amber-200 bg-amber-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-3 text-amber-800 text-xs font-bold">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>Masa aktif segera berakhir. Silakan lakukan perpanjangan durasi:</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="w-full sm:w-auto">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Durasi Perpanjangan:</span>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
                          <button onClick={() => setDaysCount(Math.max(1, daysCount - 1))} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-sm">-</button>
                          <span className="font-black text-xs w-16 text-center text-slate-800">{daysCount} Hari</span>
                          <button onClick={() => setDaysCount(daysCount + 1)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-sm">+</button>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total: Rp {calculateTotal().toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => nav("/payment-proof", { state: { plan: financePlan, total: calculateTotal(), duration: daysCount } })}
                          className="mt-1 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-100 transition-all active:scale-95"
                        >
                          <Clock size={16} /> Perpanjang Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {userRole === "admin" && (
          <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group max-w-2xl mx-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Admin Bot WhatsApp Engine</h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black border ${bot?.connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${bot?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    {bot?.connected ? "ONLINE" : "DISCONNECTED"}
                  </div>
                </div>
                <div className="flex flex-col items-center py-6 text-center">
                  <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center transition-all duration-500 ${bot?.connected ? 'bg-emerald-50 text-emerald-600 rotate-6 shadow-inner' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Bot size={56} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 mt-6 tracking-tight uppercase">
                      {bot?.connected ? "WhatsApp Server Berjalan" : "Bot Berhenti"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-[280px]">
                    {bot?.connected 
                      ? `Terhubung ke WA: ${formatPhone(bot?.phone)}` 
                      : "Sambungkan WhatsApp Server Utama untuk memproses pesan WhatsApp."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAdminConnect}
                disabled={loading}
                className={`mt-8 w-full py-5 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 relative z-10 shadow-lg active:scale-95 ${
                  bot?.connected 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <QrCode size={18}/>}
                {loading ? "PROCESSING..." : bot?.connected ? "RESTART SESSION" : "SAMBUNGKAN SEKARANG"}
              </button>
            </div>

            {!bot?.connected && (
              <div ref={qrRef} className="bg-white border-2 border-dashed border-emerald-100 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-sm mt-8 max-w-2xl mx-auto">
                <div className="max-w-md mb-8">
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-3 inline-block">Pairing Required</div>
                  <h3 className="text-2xl font-black text-slate-900">Scan WhatsApp QR Engine</h3>
                  <p className="text-slate-500 mt-2 text-xs">Khusus Admin: Scan QR ini untuk menyambungkan server WhatsApp penerima pesan.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                  {qrLoading && !bot?.qr ? (
                    <div className="flex flex-col items-center justify-center w-56 h-56">
                      <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-[9px] font-black uppercase">Generating QR...</p>
                    </div>
                  ) : bot?.qr && (
                    <div className="bg-white p-4 rounded-2xl shadow-xl animate-in zoom-in-95">
                      <img src={bot.qr} alt="QR" className="w-56 h-56 rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODAL EDIT PROFIL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Edit Profil</h3>
                <p className="text-xs text-slate-400">
                  {userRole === "admin" ? "Perbarui alamat email akun admin Anda." : "Perbarui informasi akun dan nomor WhatsApp Anda."}
                </p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {userRole !== "admin" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                    placeholder="Nama Lengkap"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                  placeholder="email@domain.com"
                />
              </div>

              {userRole !== "admin" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nomor WhatsApp (Whitelist)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                    placeholder="08xxxxxxxxxx"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nomor ini otomatis menjadi whitelist bot keuangan Anda.</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? <RefreshCw className="animate-spin" size={16} /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}