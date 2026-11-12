import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { getToken } from "../utils/auth";
import Swal from "sweetalert2";
import { 
  ArrowLeft, Calendar, TrendingUp, TrendingDown, 
  Wallet, FileText, RefreshCw, BarChart3, Trash2, Edit3, Share2, Globe, Filter, X 
} from "lucide-react";

export default function RekapPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("Pengguna");
  const [shareToken, setShareToken] = useState("");

  // State untuk Filter & Pencarian
  const [filterType, setFilterType] = useState("all"); // 'all', 'month', 'range'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format YYYY-MM
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { token } = useParams();
  const navigate = useNavigate();

  const fetchRekapData = async () => {
    try {
      setLoading(true);

      if (token) {
        const res = await api.get(`/finance/public/${token}`);
        if (res.data.success) {
          setTransactions(res.data.transactions);
          setOwnerName(res.data.ownerName);
        }
      } else {
        const authToken = getToken();
        if (!authToken) {
          navigate("/login");
          return;
        }

        const [listRes, profileRes] = await Promise.all([
          api.get("/finance"),
          api.get("/auth/profile").catch(() => ({ data: { shareToken: "" } }))
        ]);

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

  // Filter transaksi berdasarkan pilihan user (Bulan / Range / Semua)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      
      if (filterType === "month" && selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        return (
          txDate.getFullYear() === parseInt(year) &&
          txDate.getMonth() + 1 === parseInt(month)
        );
      }
      
      if (filterType === "range" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }

      return true;
    });
  }, [transactions, filterType, selectedMonth, startDate, endDate]);

  // Kalkulasi total berdasarkan transaksi yang sedang terfilter
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "INCOME") {
          acc.income += tx.totalAmount;
        } else if (tx.type === "EXPENSE") {
          acc.expense += tx.totalAmount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

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

  // Fungsi Edit Transaksi (PUT /api/finance/:id)
  const handleEdit = async (tx) => {
    const currentName = tx.items?.[0]?.name || tx.rawText || "";
    const currentDate = tx.date ? tx.date.split("T")[0] : "";

    const { value: formValues } = await Swal.fire({
      title: "Edit Transaksi",
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <label style="font-weight: bold; color: #334155;">Keterangan / Nama Item:</label>
          <input id="swal-input-name" class="swal2-input" style="margin: 0; width: 100%;" value="${currentName}">
          
          <label style="font-weight: bold; color: #334155;">Vendor / Sumber:</label>
          <input id="swal-input-vendor" class="swal2-input" style="margin: 0; width: 100%;" value="${tx.vendor || ""}">
          
          <label style="font-weight: bold; color: #334155;">Jumlah (Rp):</label>
          <input id="swal-input-amount" type="number" class="swal2-input" style="margin: 0; width: 100%;" value="${tx.totalAmount}">
          
          <label style="font-weight: bold; color: #334155;">Tipe Transaksi:</label>
          <select id="swal-input-type" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="INCOME" ${tx.type === "INCOME" ? "selected" : ""}>Pemasukan (INCOME)</option>
            <option value="EXPENSE" ${tx.type === "EXPENSE" ? "selected" : ""}>Pengeluaran (EXPENSE)</option>
          </select>

          <label style="font-weight: bold; color: #334155;">Tanggal:</label>
          <input id="swal-input-date" type="date" class="swal2-input" style="margin: 0; width: 100%;" value="${currentDate}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
      preConfirm: () => {
        return {
          name: document.getElementById("swal-input-name").value,
          vendor: document.getElementById("swal-input-vendor").value,
          totalAmount: parseFloat(document.getElementById("swal-input-amount").value),
          type: document.getElementById("swal-input-type").value,
          date: document.getElementById("swal-input-date").value,
        };
      }
    });

    if (formValues) {
      try {
        const payload = {
          totalAmount: formValues.totalAmount,
          type: formValues.type,
          vendor: formValues.vendor,
          date: formValues.date,
          items: [{ name: formValues.name, price: formValues.totalAmount, qty: 1 }]
        };

        const res = await api.put(`/finance/${tx._id}`, payload);
        if (res.data.success || res.status === 200) {
          Swal.fire({ icon: "success", title: "Berhasil", text: "Transaksi berhasil diperbarui!", timer: 1500, showConfirmButton: false });
          fetchRekapData();
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Gagal", text: "Tidak dapat memperbarui transaksi." });
      }
    }
  };

  // Fungsi Hapus Transaksi (DELETE /api/finance/:id)
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
        if (res.data.success || res.status === 200) {
          Swal.fire({ icon: "success", title: "Terhapus", text: "Transaksi berhasil dihapus.", timer: 1500, showConfirmButton: false });
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

          {/* FILTER SECTION (Bulan, Range, Semua) */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter size={15} className="text-emerald-600" /> Filter:
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === "all" ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
              >
                Semua Waktu
              </button>
              <button
                onClick={() => setFilterType("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === "month" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => setFilterType("range")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === "range" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
              >
                Rentang Tanggal
              </button>
            </div>

            {/* Input Filter Spesifik */}
            {filterType === "month" && (
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {filterType === "range" && (
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-bold">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
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
              <span>{filteredTransactions.length} Transaksi Ditampilkan</span>
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
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400">Tidak ada data transaksi yang sesuai dengan filter.</p>
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
                  {filteredTransactions.map((tx) => {
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleEdit(tx)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all" title="Edit">
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => handleDelete(tx._id, itemName)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all" title="Hapus">
                                <Trash2 size={15} />
                              </button>
                            </div>
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