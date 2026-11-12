import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import config from "../config";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, Save, RefreshCw, Users, Sliders, 
  ArrowLeft, CreditCard, Bot, QrCode, ShieldAlert, CheckCircle2, XCircle
} from "lucide-react";

export default function Admin() {
  const BASE_URL = config?.BASE_URL || "";
  const navigate = useNavigate();

  // Active Tab State: 'users', 'pricing', atau 'bot'
  const [activeTab, setActiveTab] = useState("users");

  // State User & Payment
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // State Pricing Config
  const [savingPricing, setSavingPricing] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    pricePerDay: 2000,
    priceMonthly: 60000,
    oldPrice: "250k",
    activePromoText: "Otomatis Whitelist WA"
  });

  // State Bot WhatsApp Engine
  const [bot, setBot] = useState({ connected: false, phone: null, qr: null });
  const [botLoading, setBotLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const qrRef = useRef(null);

  // --- 1. LOAD USERS & PAYMENT (Dengan Safe Fallback agar tidak blank screen) ---
  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const [resUsers, resPayment] = await Promise.all([
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/payment-proof/all").catch(() => ({ data: [] }))
      ]);

      const usersList = Array.isArray(resUsers.data) ? resUsers.data : [];
      const paymentList = Array.isArray(resPayment.data) ? resPayment.data : [];

      const merged = usersList.map((u) => {
        const proof = paymentList.find((p) => p?.userId?._id === u._id);
        return {
          ...u,
          proofStatus: proof?.status || "none",
          proofImage: proof?.imageUrl || null,
          proofId: proof?._id || null,
          proofNote: proof?.note || "",
          planName: proof?.planName || "-",
          duration: proof?.duration || 0,
          totalPaid: proof?.totalPaid || 0,
        };
      });
      setUsers(merged);
    } catch (err) {
      console.error("Gagal memuat data user:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- 2. LOAD PRICING CONFIG ---
  const loadPricingData = async () => {
    setLoadingPricing(true);
    try {
      const pricingRes = await api.get("/settings/pricing").catch(() => null);
      if (pricingRes?.data) {
        setPricingForm({
          pricePerDay: pricingRes.data.pricePerDay || 2000,
          priceMonthly: pricingRes.data.priceMonthly || 60000,
          oldPrice: pricingRes.data.oldPrice || "250k",
          activePromoText: pricingRes.data.activePromoText || "Otomatis Whitelist WA"
        });
      }
    } catch (err) {
      console.error("Gagal memuat pricing:", err);
    } finally {
      setLoadingPricing(false);
    }
  };

  // --- 3. LOAD BOT STATUS ---
  const loadBotStatus = async () => {
    try {
      const botRes = await api.get("/bot/status").catch(() => null);
      if (botRes?.data) {
        setBot(botRes.data);
        if (botRes.data?.qr) setQrLoading(false);
        return botRes.data;
      }
      return null;
    } catch (err) {
      console.error("Gagal memuat status bot");
      return null;
    }
  };

  useEffect(() => {
    if (activeTab === "users") loadUsersData();
    else if (activeTab === "pricing") loadPricingData();
    else if (activeTab === "bot") loadBotStatus();
  }, [activeTab]);

  // Polling khusus saat tab Bot aktif dan belum terkoneksi
  useEffect(() => {
    let interval;
    if (activeTab === "bot" && !bot?.connected) {
      interval = setInterval(() => {
        loadBotStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, bot?.connected]);

  // --- HANDLE PRICING SAVE ---
  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    try {
      setSavingPricing(true);
      await api.put("/settings/pricing", {
        pricePerDay: Number(pricingForm.pricePerDay),
        priceMonthly: Number(pricingForm.priceMonthly),
        oldPrice: pricingForm.oldPrice,
        activePromoText: pricingForm.activePromoText
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Konfigurasi pricing berhasil diperbarui.",
        timer: 2000,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#fff"
      });
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.error || "Gagal menyimpan pricing", "error");
    } finally {
      setSavingPricing(false);
    }
  };

  // --- HANDLE BOT CONNECT / RESTART ---
  const handleAdminConnect = async () => {
    try {
      setBotLoading(true);
      if (!bot?.connected) {
        setQrLoading(true);
        setBot((b) => (b ? { ...b, qr: null } : { connected: false, phone: null, qr: null }));
      }
      
      await api.post("/bot/start");
      const currentStatus = await loadBotStatus();

      if (currentStatus?.connected) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Engine bot berhasil terhubung dan siap digunakan.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setTimeout(() => {
          qrRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menghubungkan engine bot", "error");
    } finally {
      setBotLoading(false);
      setQrLoading(false);
    }
  };

  const formatPhone = (jid) => {
    if (!jid) return null;
    const number = jid.split(":")[0].split("@")[0];
    return "+" + number;
  };

  // --- USER ACTIONS ---
  const activate = async (id) => {
    const { value: days } = await Swal.fire({
      title: "Durasi Subscription (Hari)",
      input: "number",
      inputValue: 30,
      showCancelButton: true,
      confirmButtonText: "Aktifkan",
      background: "#0f172a",
      color: "#fff",
    });
    if (!days) return;
    setActionLoading(true);
    try {
      await api.post("/admin/activate-subscription", { userId: id, days: Number(days) });
      Swal.fire({ icon: "success", text: "Subscription diaktifkan", background: "#0f172a", color: "#fff" });
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal mengaktifkan", "error"); }
    finally { setActionLoading(false); }
  };

  const showProof = async (user) => {
    if (!user.proofImage) return Swal.fire("Tidak ada bukti bayar", "", "info");
    const imgUrl = `${BASE_URL}${user.proofImage}`;
    const isApproved = user.proofStatus === "approved";
    const result = await Swal.fire({
      title: user.email,
      html: `
        <img src="${imgUrl}" style="width:100%;max-height:300px;object-fit:contain;border-radius:10px;margin-bottom:10px"/>
        <div style="text-align: left; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 10px; color: #334155; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;">Paket: <b>${user.planName}</b></p>
            <p style="margin: 4px 0;">Durasi: <b>${user.duration} Hari</b></p>
            <p style="margin: 4px 0;">Total Bayar: <b>Rp ${user.totalPaid?.toLocaleString("id-ID")}</b></p>
        </div>
        <p>Status: <b style="color: ${isApproved ? '#059669' : '#d97706'}">${user.proofStatus.toUpperCase()}</b></p>
      `,
      showCancelButton: true,
      showDenyButton: !isApproved,
      confirmButtonText: isApproved ? "Tutup" : "Approve",
      denyButtonText: "Reject",
      cancelButtonText: "Kembali",
      width: 450
    });
    if (!isApproved) {
      if (result.isConfirmed) return approve(user);
      if (result.isDenied) return reject(user.proofId);
    }
  };

  const approve = async (user) => {
    const { value: note } = await Swal.fire({ title: "Catatan (opsional)", input: "text", showCancelButton: true });
    if (note === undefined) return;
    try {
      await api.post(`/payment-proof/approve/${user.proofId}`, { note });
      await api.post("/admin/activate-subscription", { userId: user._id, days: user.duration });
      Swal.fire("Berhasil", "Pembayaran disetujui & Subscription aktif", "success");
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal menyetujui", "error"); }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({ title: "Alasan penolakan", input: "text", showCancelButton: true, confirmButtonColor: "#dc2626" });
    if (!note) return;
    try {
      await api.post(`/payment-proof/reject/${id}`, { note });
      Swal.fire("Ditolak", "Pembayaran ditolak", "info");
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal menolak", "error"); }
  };

  const deactivate = async (user) => {
    const yes = await Swal.fire({ title: "Nonaktifkan user / sesi?", icon: "warning", showCancelButton: true, background: "#0f172a", color: "#fff" });
    if (!yes.isConfirmed) return;
    setActionLoading(true);
    try {
      await api.post("/bot/reset-session", { userId: user._id });
      loadUsersData();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Sesi berhasil direset", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  const deleteUser = async (id) => {
    const yes = await Swal.fire({ title: "Hapus user?", icon: "error", showCancelButton: true, confirmButtonColor: "#dc2626", background: "#0f172a", color: "#fff" });
    if (!yes.isConfirmed) return;
    setActionLoading(true);
    try {
      await api.post("/admin/delete-user", { userId: id });
      loadUsersData();
      Swal.fire({ icon: "success", title: "Terhapus", text: "User berhasil dihapus", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Gagal menghapus", "error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10 font-sans text-slate-800 pb-20">
      <TopBar title="Admin Panel" subtitle="Kelola user, pembayaran, harga paket, & bot WhatsApp" variant="admin" />

      {/* HEADER NAVIGATION BUTTONS & TABS */}
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-4 mt-6 mb-6 justify-between items-stretch xl:items-center">
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => navigate("/dashboard")} className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-700 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button onClick={() => navigate("/admin/payment-proof")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95">
            <CreditCard size={16} /> Cek Bukti Pembayaran
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-1.5 border border-slate-300/60 overflow-x-auto shadow-inner">
          <button onClick={() => setActiveTab("users")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === "users" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            <Users size={15} /> User & Pembayaran
          </button>
          <button onClick={() => setActiveTab("pricing")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === "pricing" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            <Sliders size={15} /> Setting Pricing
          </button>
          <button onClick={() => setActiveTab("bot")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === "bot" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            <Bot size={15} /> Bot WhatsApp
          </button>
        </div>
      </div>

      {/* ================= TAB 1: USERS & PEMBAYARAN ================= */}
      {activeTab === "users" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <input 
              placeholder="Cari email user..." 
              className="bg-white border border-slate-200 px-4 py-3 sm:py-2.5 rounded-2xl w-full sm:w-80 shadow-sm outline-none text-xs font-bold text-slate-700 focus:border-blue-500 transition-all" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
            />
            <button onClick={loadUsersData} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 sm:py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
              <RefreshCw size={14} className={loadingUsers ? "animate-spin text-blue-600" : ""} /> Refresh Data
            </button>
          </div>
          
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-5">Email</th>
                    <th className="p-5 text-center">Role</th>
                    <th className="p-5 text-center">Subscription</th>
                    <th className="p-5 text-center">Paket</th>
                    <th className="p-5 text-center">Status Pembayaran</th>
                    <th className="p-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center text-slate-400 uppercase font-black">Memuat data pengguna...</td>
                    </tr>
                  ) : users.filter((u) => u.email?.toLowerCase().includes(filter.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center text-slate-400 uppercase font-black">Tidak ada data user ditemukan.</td>
                    </tr>
                  ) : (
                    users.filter((u) => u.email?.toLowerCase().includes(filter.toLowerCase())).map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 font-extrabold text-slate-900">{u.email}</td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-center font-medium text-slate-500">
                          {u.subscribedUntil ? new Date(u.subscribedUntil).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                        </td>
                        <td className="p-5 text-center text-xs font-black text-blue-600">
                          {u.planName !== "-" ? `${u.planName} (${u.duration} H)` : "—"}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                            u.proofStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            u.proofStatus === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {u.proofStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            {u.proofImage && (
                              <button onClick={() => showProof(u)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95">
                                Bukti
                              </button>
                            )}
                            <button disabled={actionLoading} onClick={() => activate(u._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50">
                              Activate
                            </button>
                            <button disabled={actionLoading} onClick={() => deactivate(u)} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50">
                              Deactivate
                            </button>
                            <button disabled={actionLoading || u.role === "admin"} onClick={() => deleteUser(u._id)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SETTING PRICING ================= */}
      {activeTab === "pricing" && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-base mb-6">Konfigurasi Harga Paket</h3>
          <form onSubmit={handleSavePricing} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Harga Dasar Per Hari (Rp)</label>
              <input 
                type="number" 
                name="pricePerDay" 
                value={pricingForm.pricePerDay} 
                onChange={handlePricingChange} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500 transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Harga Bulanan (Rp)</label>
              <input 
                type="number" 
                name="priceMonthly" 
                value={pricingForm.priceMonthly} 
                onChange={handlePricingChange} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500 transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Coretan Harga Lama (Contoh: 250k)</label>
              <input 
                type="text" 
                name="oldPrice" 
                value={pricingForm.oldPrice} 
                onChange={handlePricingChange} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Teks Promo Aktif</label>
              <input 
                type="text" 
                name="activePromoText" 
                value={pricingForm.activePromoText} 
                onChange={handlePricingChange} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
            <button 
              type="submit" 
              disabled={savingPricing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {savingPricing ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: BOT WHATSAPP ENGINE ================= */}
      {activeTab === "bot" && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Admin Bot WhatsApp Engine</h3>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black border ${bot?.connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bot?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                {bot?.connected ? "ONLINE" : "DISCONNECTED"}
              </div>
            </div>

            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Bot size={48} className="sm:w-[56px] sm:h-[56px]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-6 tracking-tight uppercase">
                {bot?.connected ? "WhatsApp Terhubung" : "Bot Berhenti"}
              </h2>
              <p className="text-xs text-slate-500 mt-2 font-medium max-w-[280px]">
                {bot?.connected 
                  ? `Terhubung ke WA: ${formatPhone(bot?.phone)}` 
                  : "Sambungkan WhatsApp Server Utama untuk memproses pesan WhatsApp."}
              </p>
            </div>

            <button
              onClick={handleAdminConnect}
              disabled={botLoading}
              className={`mt-6 w-full py-4 sm:py-5 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                bot?.connected 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {botLoading ? <RefreshCw className="animate-spin" size={18}/> : <QrCode size={18}/>}
              {botLoading ? "PROCESSING..." : bot?.connected ? "RESTART SESSION" : "SAMBUNGKAN SEKARANG"}
            </button>
          </div>

          {!bot?.connected && (
            <div ref={qrRef} className="bg-white border-2 border-dashed border-emerald-200 rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center text-center shadow-sm">
              <div className="max-w-md mb-6 sm:mb-8">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-3 inline-block">Pairing Required</div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Scan WhatsApp QR Engine</h3>
                <p className="text-slate-500 mt-2 text-xs font-medium">Scan QR ini menggunakan aplikasi WhatsApp di HP Anda untuk menghubungkan bot.</p>
              </div>
              <div className="p-4 sm:p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-inner">
                {qrLoading && !bot?.qr ? (
                  <div className="flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Generating QR...</p>
                  </div>
                ) : bot?.qr ? (
                  <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
                    <img src={bot.qr} alt="QR" className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56 text-slate-400">
                    <QrCode size={48} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold">Klik tombol di atas untuk memunculkan QR</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}