import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { getToken } from "../utils/auth";
import Swal from "sweetalert2";
import { 
  ArrowLeft, Calendar, TrendingUp, TrendingDown, 
  Wallet, FileText, RefreshCw, BarChart3, Trash2, Share2, Globe 
} from "lucide-react";

export default function RekapPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [ownerName, setOwnerName] = useState("Pengguna");
  const [shareToken, setShareToken] = useState("");
  
  const { token } = useParams(); // Menangkap random character dari URL (jika ada)
  const navigate = useNavigate();

  const fetchRekapData = async () => {
    try {
      setLoading(true);

      if (token) {
        // Mode Publik: Mengambil data berdasarkan random token URL
        const res = await api.get(`/finance/public/${token}`);
        if (res.data.success) {
          setTotals(res.data.summary);
          setTransactions(res.data.transactions);
          setOwnerName(res.data.ownerName);
        }
      } else {
        // Mode Privat (User Login): Mengambil data via token auth
        const authToken = getToken();
        if (!authToken) {
          navigate("/login");
          return;
        }

        const [summaryRes, listRes, profileRes] = await Promise.all([
          api.get("/finance/summary"),
          api.get("/finance"),
          api.get("/auth/profile").catch(() => ({ data: { shareToken: "" } }))
        ]);

        if (summaryRes.data.success) {
          setTotals({
            income: summaryRes.data.summary.income,
            expense: summaryRes.data.summary.expense
          });
        }

        if (listRes.data.success) {
          setTransactions(listRes.data.transactions);
        }

        if (profileRes.data?.shareToken) {
          setShareToken(profileRes.data.shareToken);
        }
      }
    } catch (err) {
      console.error("Gagal memuat rekap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekapData();
  }, [token, navigate]);

  // Fungsi untuk menyalin link rekap publik ber-token acak
  const handleCopyPublicLink = () => {
    if (!shareToken) {
      Swal.fire({ icon: "info", title: "Info", text: "Token publik belum tersedia untuk akun ini." });
      return;
    }
    const publicUrl = `${window.location.origin}/rekap/${shareToken}`;
    navigator.clipboard.writeText(publicUrl);
    Swal.fire({
      icon: "success",
      title: "Link Berhasil Disalin!",
      text: "Siapa pun yang memiliki link ini dapat melihat rekap keuangan secara publik.",
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDelete = async (id, itemName) => {
    const confirm = await Swal.fire({
      title: "Hapus Transaksi?",
      text: `Yakin ingin menghapus "${itemName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await api.delete(`/finance/${id}`);
        if (res.data.success) {
          fetchRekapData();
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Gagal", text: "Tidak dapat menghapus transaksi." });
      }
    }
  };

  const netBalance = totals.income - totals.expense;
  const totalVolume = totals.income + totals.expense;
  const incomePercent = totalVolume > 0 ? (totals.income / totalVolume) * 100 : 50;
  const expensePercent = totalVolume > 0 ? (totals.expense / totalVolume) * 100 : 50;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans p-6 md:p-10 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Tombol Navigasi & Bagikan Link Publik */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {!token && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm border border-slate-200 transition-all"
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {!token && shareToken && (
              <button
                onClick={handleCopyPublicLink}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-100 transition-all active:scale-95"
              >
                <Share2 size={14} /> Salin Link Publik Unik
              </button>
            )}
            <button
              onClick={fetchRekapData}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-100 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* HEADER & STATISTIK */}
        <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Rekap Keuangan</h1>
                {token && <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Globe size={10} /> Public Session</span>}
              </div>
              <p className="text-xs text-slate-400 font-medium">Laporan finansial milik: <strong className="text-slate-700">{ownerName}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/60 border border-emerald-100 p-6 rounded-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Pemasukan</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">Rp {totals.income.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-rose-50/60 border border-rose-100 p-6 rounded-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Total Pengeluaran</span>
              <p className="text-2xl font-black text-rose-700 mt-1">Rp {totals.expense.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Bersih</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">Rp {netBalance.toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* Rasio Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 text-xs font-black uppercase text-slate-700">
              <span className="flex items-center gap-2"><BarChart3 size={16} className="text-emerald-600" /> Rasio Arus Kas</span>
              <span>{transactions.length} Transaksi</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: `${incomePercent}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
              <div style={{ width: `${expensePercent}%` }} className="bg-rose-500 h-full transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* TABEL TRANSAKSI */}
        <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6">Riwayat Transaksi</h3>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400 font-bold uppercase">Memuat data sesi...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400">Belum ada data transaksi pada sesi ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pb-4">Tanggal</th>
                    <th className="pb-4">Keterangan</th>
                    <th className="pb-4">Vendor</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Jumlah (Rp)</th>
                    {!token && <th className="pb-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === "INCOME";
                    const itemName = tx.items?.[0]?.name || tx.rawText || "Transaksi";
                    const dateStr = new Date(tx.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });

                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 text-slate-400 font-medium flex items-center gap-1.5"><Calendar size={14} /> {dateStr}</td>
                        <td className="py-4 text-slate-800 font-extrabold">{itemName}</td>
                        <td className="py-4 text-slate-500">{tx.vendor || "Umum"}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className={`py-4 text-right font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? "+" : "-"} Rp {tx.totalAmount.toLocaleString("id-ID")}
                        </td>
                        {!token && (
                          <td className="py-4 text-center">
                            <button onClick={() => handleDelete(tx._id, itemName)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all" title="Hapus">
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}