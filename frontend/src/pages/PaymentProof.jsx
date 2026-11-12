import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";
import qrCodeImage from "../assets/qr-code.jpeg";
import { 
  ArrowLeft, 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2,
  Wallet,
  HelpCircle
} from "lucide-react";

const StyledSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] border-none shadow-2xl p-8',
    title: 'text-2xl font-black text-slate-800 tracking-tight',
    htmlContainer: 'text-slate-500 font-medium mt-2',
    confirmButton: 'rounded-2xl font-black text-[10px] px-8 py-4 uppercase tracking-[0.2em] shadow-lg focus:ring-0 mx-2',
  },
  buttonsStyling: true,
});

export default function PaymentProof() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const topRef = useRef(null);
  const nav = useNavigate();
  const location = useLocation();
  
  // Ambil data kiriman dari Dashboard
  const { plan, total, duration } = location.state || {};

  // Auto scroll ke paling atas saat halaman dimuat agar nominal terlihat
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const upload = async () => {
    if (!file) {
      return StyledSwal.fire({
        icon: "warning",
        title: "GAMBAR KOSONG",
        html: "Pilih foto bukti transfer Anda terlebih dahulu.",
        confirmButtonColor: "#2563eb",
      });
    }

    setLoading(true);
    const fd = new FormData();
    const token = getToken();
    
    try {
      const decoded = jwtDecode(token);
      
      // 1. Data Identitas & File
      fd.append("userId", decoded.uid);
      fd.append("image", file);

      // 2. Data Tambahan Paket & Pembayaran
      fd.append("planName", plan?.name || "Regular");
      fd.append("duration", duration || 1);
      fd.append("totalPaid", total || 0);
      fd.append("paymentMethod", "QRIS balaskan.id");

      await api.post("/payment-proof/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      StyledSwal.fire({
        icon: "success",
        title: "UPLOAD BERHASIL",
        html: `Bukti untuk paket <b>${plan?.name}</b> telah diterima. Admin akan memverifikasi akun Anda segera.`,
        confirmButtonColor: "#2563eb",
      });

      nav("/dashboard");
    } catch (err) {
      console.error("UPLOAD ERROR:", err.response?.data);
      StyledSwal.fire({
        icon: "error",
        title: "UPLOAD GAGAL",
        html: "Terjadi kendala saat mengirim gambar. Pastikan koneksi stabil.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-6 font-sans selection:bg-blue-100 pb-24">
      
      {/* BACK BUTTON */}
      <div className="w-full max-w-xl mb-8">
        <button
          onClick={() => nav("/dashboard")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group"
        >
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 group-hover:border-blue-100">
            <ArrowLeft size={16} />
          </div>
          Kembali ke Dashboard
        </button>
      </div>

      <div className="w-full max-w-xl space-y-6">
        
        {/* ORDER SUMMARY CARD */}
        {plan && (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Ringkasan Pesanan</h3>
                 <div className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">UNPAID</div>
               </div>

               <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="bg-blue-500/20 p-2.5 rounded-xl"><Wallet size={18} className="text-blue-400"/></div>
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paket Layanan</p>
                       <p className="font-black text-sm">{plan.name}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Durasi</p>
                     <p className="font-black text-sm">{duration} Hari</p>
                   </div>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Harus Dibayar</p>
                    <p className="text-2xl font-black text-blue-400">Rp {total ? total.toLocaleString('id-ID') : 0}</p>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* QRIS / QR CODE & INSTRUKSI PEMBAYARAN */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[3rem] p-8 md:p-10 flex flex-col items-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Scan QRIS di bawah ini untuk membayar</p>
          <img 
            src={qrCodeImage} 
            alt="QR Code balaskan.id" 
            className="w-full max-w-sm h-auto object-contain rounded-3xl shadow-md bg-white p-2 mb-8 border border-slate-100"
          />

          {/* KARTU INSTRUKSI TATA CARA BAYAR */}
          <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <HelpCircle size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tata Cara Pembayaran QRIS</h4>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 font-medium list-decimal list-inside">
              <li className="leading-relaxed">
                Buka aplikasi Mobile Banking atau Dompet Digital (E-Wallet) Anda seperti <span className="font-bold text-slate-800">BCA, GoPay, OVO, Dana, ShopeePay, Mandiri, dll</span>.
              </li>
              <li className="leading-relaxed">
                Pilih menu <span className="font-bold text-slate-800">Scan / QRIS</span> pada aplikasi pembayaran Anda.
              </li>
              <li className="leading-relaxed">
                Arahkan kamera ke gambar QR Code di atas atau pilih <span className="font-bold text-slate-800">Upload dari Galeri</span> (jika Anda men-screenshot atau mendownload QR code ini).
              </li>
              <li className="leading-relaxed">
                Pastikan nominal pembayaran sesuai dengan total tagihan (<span className="font-bold text-blue-600">Rp {total ? total.toLocaleString('id-ID') : 0}</span>).
              </li>
              <li className="leading-relaxed">
                Selesaikan transaksi dan <span className="font-bold text-slate-800">screenshot/simpan bukti pembayaran</span> untuk di-upload pada form di bawah.
              </li>
            </ol>
          </div>
        </div>

        {/* UPLOAD AREA */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[3rem] p-10 relative overflow-hidden">
          <header className="mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Upload Bukti Bayar</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Lampirkan screenshot untuk verifikasi otomatis.</p>
          </header>

          <div className="space-y-6">
            <label className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group
              ${preview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-white'}`}
            >
              <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
              
              {!preview ? (
                <>
                  <div className="bg-white p-5 rounded-[1.5rem] shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                    <UploadCloud size={40} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-700 text-sm uppercase tracking-wide">Pilih Gambar</p>
                  </div>
                </>
              ) : (
                <div className="relative w-full animate-in zoom-in-95 duration-300">
                  <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-2xl border shadow-md" />
                  <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg"><CheckCircle2 size={20} /></div>
                </div>
              )}
            </label>

            <button
              onClick={upload}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95
                ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <ImageIcon size={18}/>}
              {loading ? "MENGUPLOAD..." : "KONFIRMASI PEMBAYARAN"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
          Proses verifikasi manual memakan waktu 1-12 jam kerja.
        </p>
      </div>
    </div>
  );
}