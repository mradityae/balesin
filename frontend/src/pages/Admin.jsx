import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import config from "../config";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, Save, RefreshCw, Users, Sliders, 
  ArrowLeft, CreditCard, Bot, QrCode, Terminal 
} from "lucide-react";

export default function Admin() {
  const BASE_URL = config.BASE_URL;
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
  const [bot, setBot] = useState(null);
  const [botLoading, setBotLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const qrRef = useRef(null);

  // --- 1. LOAD USERS & PAYMENT ---
  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/admin/users");
      const paymentProof = await api.get("/payment-proof/all");

      const merged = res.data.map((u) => {
        const proof = paymentProof.data.find((p) => p.userId?._id === u._id);
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
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- 2. LOAD PRICING CONFIG ---
  const loadPricingData = async () => {
    setLoadingPricing(true);
    try {
      const pricingRes = await api.get("/settings/pricing");
      if (pricingRes?.data) {
        setPricingForm({
          pricePerDay: pricingRes.data.pricePerDay || 2000,
          priceMonthly: pricingRes.data.priceMonthly || 60000,
          oldPrice: pricingRes.data.oldPrice || "250k",
          activePromoText: pricingRes.data.activePromoText || "Otomatis Whitelist WA"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPricing(false);
    }
  };

  // --- 3. LOAD BOT STATUS ---
  const loadBotStatus = async () => {
    try {
      const botRes = await api.get("/bot/status");
      setBot(botRes.data);
      if (botRes.data?.qr) setQrLoading(false);
    } catch (err) {
      console.error("Gagal memuat status bot");
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
        setBot(b => (b ? { ...b, qr: null } : null));
      }
      await api.post("/bot/start");
      await loadBotStatus();
      if (!bot?.connected) {
        setTimeout(() => { qrRef.current?.scrollIntoView({ behavior: "smooth" }); }, 200);
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
        <img src="${imgUrl}" style="width:100%;border-radius:10px;margin-bottom:10px"/>
        <div style="text-align: left; font-size: 14px; background: #f4f4f4; padding: 10px; border-radius: 8px; margin-bottom: 10px; color: #333;">
            <p style="margin: 5px 0;">Paket: <b>${user.planName}</b></p>
            <p style="margin: 5px 0;">Durasi: <b>${user.duration} Hari</b></p>
            <p style="margin: 5px 0;">Total Bayar: <b>Rp ${user.totalPaid.toLocaleString()}</b></p>
        </div>
        <p>Status: <b style="color: ${isApproved ? 'green' : 'orange'}">${user.proofStatus.toUpperCase()}</b></p>
      `,
      showCancelButton: true,
      showDenyButton: !isApproved,
      confirmButtonText: isApproved ? "Tutup" : "Approve",
      denyButtonText: "Reject",
      cancelButtonText: "Kembali",
      width: 400
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
      await api.post("/admin/activate-subscription", { userId: user._id, days: user.duration * 30 });
      Swal.fire("Berhasil", "Pembayaran disetujui & Subscription aktif", "success");
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal menyetujui", "error"); }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({ title: "Alasan penolakan", input: "text", showCancelButton: true, confirmButtonColor: "#d33" });
    if (!note) return;
    try {
      await api.post(`/payment-proof/reject/${id}`, { note });
      Swal.fire("Ditolak", "Pembayaran ditolak", "info");
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal menolak", "error"); }
  };

  const deactivate = async (user) => {
    const yes = await Swal.fire({ title: "Nonaktifkan user?", icon: "warning", showCancelButton: true, background: "#0f172a", color: "#fff" });
    if (!yes.isConfirmed) return;
    setActionLoading(true);
    try {
      await api.post("/bot/reset-session", { userId: user._id });
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  const deleteUser = async (id) => {
    const yes = await Swal.fire({ title: "Hapus user?", icon: "error", showCancelButton: true, background: "#0f172a", color: "#fff" });
    if (!yes.isConfirmed) return;
    setActionLoading(true);
    try {
      await api.post("/admin/delete-user", { userId: id });
      loadUsersData();
    } catch { Swal.fire("Error", "Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10 text-gray-900">
      <TopBar title="Admin Panel" subtitle="Kelola user, pembayaran, harga paket, & bot WhatsApp" variant="admin" />

      {/* HEADER NAVIGATION BUTTONS & TABS */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 mt-8 mb-6 justify-between items-center">
        <div className="flex gap-3">
          <button onClick={() => navigate("/dashboard")} className="bg-white border px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button onClick={() => navigate("/admin/payment-proof")} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 flex items-center gap-2">
            <CreditCard size={16} /> Cek Bukti Pembayaran
          </button>
        </div>

        {/* TABS */}
        <div className="bg-gray-200 p-1 rounded-xl flex gap-1 border border-gray-300">
          <button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 ${activeTab === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
            <Users size={15} /> User & Pembayaran
          </button>
          <button onClick={() => setActiveTab("pricing")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 ${activeTab === "pricing" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600"}`}>
            <Sliders size={15} /> Setting Pricing
          </button>
          <button onClick={() => setActiveTab("bot")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 ${activeTab === "bot" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600"}`}>
            <Bot size={15} /> Bot WhatsApp
          </button>
        </div>
      </div>

      {/* ================= TAB 1: USERS & PEMBAYARAN ================= */}
      {activeTab === "users" && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <input placeholder="Cari user..." className="bg-white border px-4 py-2.5 rounded-lg w-72 shadow-sm outline-none text-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <button onClick={loadUsersData} className="bg-white border hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <RefreshCw size={14} className={loadingUsers ? "animate-spin text-blue-600" : ""} /> Refresh
            </button>
          </div>
          <div className="bg-white border rounded-xl overflow-hidden shadow">
            <table className="w-full text-sm text-gray-800 min-w-[800px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-left font-semibold">Email</th>
                  <th className="p-4 text-center font-semibold">Role</th>
                  <th className="p-4 text-center font-semibold">Subscription</th>
                  <th className="p-4 text-center font-semibold">Paket</th>
                  <th className="p-4 text-center font-semibold">Status Pembayaran</th>
                  <th className="p-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((u) => u.email.toLowerCase().includes(filter.toLowerCase())).map((u, i) => (
                  <tr key={u._id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b`}>
                    <td className="p-4 font-medium">{u.email}</td>
                    <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-gray-200'}`}>{u.role}</span></td>
                    <td className="p-4 text-center">{u.subscribedUntil ? new Date(u.subscribedUntil).toLocaleDateString() : "—"}</td>
                    <td className="p-4 text-center text-xs font-bold text-blue-600">{u.planName !== "-" ? `${u.planName} (${u.duration} Hari)` : "—"}</td>
                    <td className="p-4 text-center font-semibold">{u.proofStatus.toUpperCase()}</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        {u.proofImage && <button onClick={() => showProof(u)} className="bg-purple-600 text-white px-3 py-1 rounded text-xs">Bukti</button>}
                        <button disabled={actionLoading} onClick={() => activate(u._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Activate</button>
                        <button disabled={actionLoading} onClick={() => deactivate(u)} className="bg-gray-800 text-white px-3 py-1 rounded text-xs">Deactivate</button>
                        <button disabled={actionLoading || u.role === "admin"} onClick={() => deleteUser(u._id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SETTING PRICING ================= */}
      {activeTab === "pricing" && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-base mb-4">Konfigurasi Harga Per Hari</h3>
          <form onSubmit={handleSavePricing} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Harga Dasar Per Hari (Rp)</label>
              <input type="number" name="pricePerDay" value={pricingForm.pricePerDay} onChange={handlePricingChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-800 outline-none" required />
            </div>
            <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase">Simpan Harga</button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: BOT WHATSAPP ENGINE ================= */}
      {activeTab === "bot" && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Admin Bot WhatsApp Engine</h3>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black border ${bot?.connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bot?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                {bot?.connected ? "ONLINE" : "DISCONNECTED"}
              </div>
            </div>

            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-28 h-28 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
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

            <button
              onClick={handleAdminConnect}
              disabled={botLoading}
              className={`mt-6 w-full py-5 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg ${
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
            <div ref={qrRef} className="bg-white border-2 border-dashed border-emerald-100 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-sm">
              <div className="max-w-md mb-8">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-3 inline-block">Pairing Required</div>
                <h3 className="text-2xl font-black text-slate-900">Scan WhatsApp QR Engine</h3>
                <p className="text-slate-500 mt-2 text-xs">Scan QR ini menggunakan aplikasi WhatsApp di HP Anda untuk menghubungkan bot.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                {qrLoading && !bot?.qr ? (
                  <div className="flex flex-col items-center justify-center w-56 h-56">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase">Generating QR...</p>
                  </div>
                ) : bot?.qr && (
                  <div className="bg-white p-4 rounded-2xl shadow-xl">
                    <img src={bot.qr} alt="QR" className="w-56 h-56 rounded-lg" />
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