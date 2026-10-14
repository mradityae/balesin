import React, { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  User, Mail, Lock, CheckCircle2, 
  ArrowLeft, Bot, Sparkles, ShieldCheck, Phone 
} from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Handler khusus untuk membersihkan input nomor HP agar HANYA ANGKA
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    const numericOnly = rawValue.replace(/\D/g, "");
    setPhone(numericOnly);
  };

  // Handler khusus untuk email (menghapus spasi secara otomatis saat diketik)
  const handleEmailChange = (e) => {
    const rawValue = e.target.value;
    const noSpaces = rawValue.replace(/\s/g, ""); // Hapus semua spasi
    setEmail(noSpaces);
  };

  const submit = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Semua kolom wajib diisi ya!", confirmButtonColor: "#2563eb" });
      return;
    }

    // Validasi format email standar menggunakan Regex (tanpa spasi, berformat benar)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({ icon: "warning", title: "Format Email Tidak Valid", text: "Mohon masukkan alamat email yang benar (contoh: nama@domain.com tanpa spasi).", confirmButtonColor: "#2563eb" });
      return;
    }

    // Validasi tambahan pastikan nomor HP hanya angka
    if (!/^\d+$/.test(phone)) {
      Swal.fire({ icon: "warning", title: "Nomor WhatsApp Tidak Valid", text: "Nomor WhatsApp hanya boleh berisi angka saja (tanpa spasi, tanda +, atau huruf).", confirmButtonColor: "#2563eb" });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Password Mismatch", text: "Konfirmasi password kamu tidak sesuai.", confirmButtonColor: "#2563eb" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", { name, email, phone, password });
      
      Swal.fire({
        icon: "success",
        title: "Pendaftaran Berhasil!",
        text: "Akun kamu sudah siap. Silakan masuk.",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mendaftar",
        text: err.response?.data?.error || "Terjadi kesalahan sistem.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">
      
      {/* LEFT SIDE: VISUAL */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-2xl">
            <Bot size={48} className="text-blue-500" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight leading-tight mb-6">
            Langkah pertama menuju <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Otomatisasi Bisnis Modern</span>
          </h2>
          
          <div className="space-y-6 text-left inline-block">
            {[
              "AI mencatat transaksi langsung via WhatsApp",
              "Nomor HP otomatis ter-whitelist saat subscribe",
              "Cek Laporan & Riwayat via Chat WhatsApp",
              "Hemat biaya operasional hingga 80%"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-400">
                <div className="bg-blue-500/10 p-1 rounded-full">
                  <CheckCircle2 size={18} className="text-blue-500" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: REGISTER FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[440px]">
          
          <div className="mb-10 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider">Back to Home</span>
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
              Daftar Sekarang <Sparkles className="text-blue-600" size={24} />
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Buat akun Keuangan AI Anda hari ini.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email"
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1 font-semibold">*Tanpa spasi dan format email harus valid.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor WhatsApp (Contoh: 628123456789)</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="628131374543"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1 font-semibold">*Hanya angka saja, tanpa spasi, tanda +, atau huruf.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sedang Mendaftarkan...</span>
                </div>
              ) : (
                "Buat Akun Sekarang"
              )}
            </button>

            <p className="text-center text-slate-500 text-sm mt-6 font-medium">
              Sudah memiliki akun?{" "}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}