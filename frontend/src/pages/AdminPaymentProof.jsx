import React, { useEffect, useState } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import config from "../config";
import { Check, X, Eye, User, AlertCircle, Loader2, ArrowLeft, Filter } from "lucide-react"; 
import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";

export default function AdminPaymentProof() {
  const BASE_URL = config.BASE_URL;
  const navigate = useNavigate(); 
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Filter
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const load = async () => {
    try {
      const res = await api.get("/payment-proof/all");
      setList(res.data);
      applyFilter(res.data, filterMonth, filterYear);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Jalankan filter setiap kali dropdown berubah
  useEffect(() => {
    applyFilter(list, filterMonth, filterYear);
  }, [filterMonth, filterYear, list]);

  const applyFilter = (data, month, year) => {
    let filtered = data;
    if (month) {
      filtered = filtered.filter(p => new Date(p.createdAt).getMonth() === parseInt(month));
    }
    if (year) {
      filtered = filtered.filter(p => new Date(p.createdAt).getFullYear() === parseInt(year));
    }
    setFilteredList(filtered);
  };

  const viewImage = (fileName, userEmail) => {
    Swal.fire({
      title: `<span style="font-size: 24px; font-weight: 900;">${userEmail}</span>`,
      imageUrl: `${BASE_URL}${fileName}`,
      imageAlt: 'Bukti Pembayaran',
      width: '600px',
      imageWidth: '100%',
      confirmButtonText: "TUTUP",
      confirmButtonColor: "#2563eb",
      background: "#fff",
      customClass: {
        popup: 'rounded-[2rem]',
        image: 'rounded-xl border shadow-lg'
      }
    });
  };

  const approve = async (proof) => {
    const { value: note } = await Swal.fire({
      title: "Setujui Pembayaran?",
      html: `<b style="font-size: 18px;">User akan aktif selama ${proof.duration} bulan.</b>`,
      input: "text",
      inputPlaceholder: "Catatan internal (opsional)...",
      showCancelButton: true,
      confirmButtonText: "APPROVE & AKTIFKAN",
      confirmButtonColor: "#10b981",
    });

    if (note !== undefined) {
      try {
        await api.post(`/payment-proof/approve/${proof._id}`, { note });
        await api.post("/admin/activate-subscription", {
          userId: proof.userId?._id,
          days: proof.duration * 30,
        });
        Swal.fire("Berhasil", "Subscription aktif!", "success");
        load();
      } catch (err) {
        Swal.fire("Error", "Gagal konfirmasi", "error");
      }
    }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({
      title: "Tolak Pembayaran?",
      input: "text",
      inputPlaceholder: "Alasan penolakan...",
      showCancelButton: true,
      confirmButtonText: "REJECT",
      confirmButtonColor: "#ef4444",
      inputValidator: (v) => !v && "Alasan wajib diisi!"
    });
    if (note) {
      try {
        await api.post(`/payment-proof/reject/${id}`, { note });
        load();
      } catch (err) {
        Swal.fire("Error", "Gagal menolak", "error");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
       <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      <div className="pt-10">
        <TopBar title="Verification Center" subtitle="Approval bukti bayar otomatis" variant="admin" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-[11px] tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm w-fit"
          >
            <ArrowLeft size={16} /> KEMBALI
          </button>

          {/* FILTER SECTION */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="pl-3 text-slate-400">
              <Filter size={16} />
            </div>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent font-bold text-xs outline-none border-none cursor-pointer p-2"
            >
              <option value="">Semua Bulan</option>
              {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent font-bold text-xs outline-none border-none cursor-pointer p-2 border-l border-slate-100"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-[3rem]">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredList.map((p) => (
              <div key={p._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-6 flex flex-col hover:scale-[1.02] transition-transform duration-300">
                
                {/* Header: Teks digedein */}
                <div className="mb-4">
                  <p className="font-black text-lg text-slate-800 leading-tight truncate">{p.userId?.email || 'User'}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter 
                      ${p.status === 'approved' ? 'bg-green-100 text-green-600' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Preview Image: Dikecilin (h-48 dari h-64) */}
                <div className="relative rounded-[1.5rem] overflow-hidden border bg-gray-50 h-48 group">
                  <img src={`${BASE_URL}${p.imageUrl}`} alt="Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => viewImage(p.imageUrl, p.userId?.email)} className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-black text-xs shadow-2xl flex items-center gap-2">
                      <Eye size={16} /> ZOOM PROOF
                    </button>
                  </div>
                </div>

                {/* Info Detail: Teks digedein */}
                <div className="mt-5 space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase">Paket</span>
                      <span className="text-sm font-black text-blue-600 uppercase tracking-tighter">{p.planName} ({p.duration} BLN)</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase">Total Bayar</span>
                      <span className="text-base font-black text-slate-900 underline decoration-blue-200">Rp {p.totalPaid?.toLocaleString()}</span>
                   </div>
                </div>

                {/* Note Area */}
                {p.note && (
                  <div className="mt-4 bg-amber-50 text-amber-600 p-4 rounded-2xl text-xs font-bold border border-amber-100 italic">
                    Note: {p.note}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-6">
                  {p.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => approve(p)} className="bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                        <Check size={16} /> APPROVE
                      </button>
                      <button onClick={() => reject(p._id)} className="bg-white text-rose-600 border border-rose-100 py-4 rounded-2xl font-black text-[10px] tracking-widest hover:bg-rose-50 flex items-center justify-center gap-2">
                        <X size={16} /> REJECT
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 tracking-[0.3em]">
                      SUDAH DIPROSES
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}