import React, { useState } from "react";
import api from "../services/api";
import { setToken } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { Mail, Lock, ArrowLeft, Bot, Sparkles, LogIn, ShieldAlert } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  // const [captcha, setCaptcha] = useState(null);
  const nav = useNavigate();

  const submit = async () => {
    if (!email || !password) {
      Swal.fire({ icon: "warning", title: "Oops!", text: "Email dan password wajib diisi", confirmButtonColor: "#2563eb" });
      return;
    }

    // if (failCount >= 3 && !captcha) {
    //   Swal.fire({ icon: "warning", title: "Verifikasi Keamanan", text: "Mohon selesaikan Captcha!" });
    //   return;
    // }

    try {
      setLoading(true);
      // const res = await api.post("/auth/login", { email, password, captcha });
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;

      setToken(token);
      const payload = jwtDecode(token);

      Swal.fire({
        icon: "success",
        title: "Selamat Datang!",
        text: "Login berhasil, mengalihkan...",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        nav(payload.role === "admin" ? "/admin" : "/dashboard");
      }, 1500);

    } catch (err) {
      setFailCount(prev => prev + 1);
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Email atau password salah. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">
      
      {/* LEFT SIDE: VISUAL (Identik dengan Register untuk Branding) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 mb-8 shadow-2xl animate-pulse">
            <Bot size={56} className="text-blue-500" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight mb-6">
            Pantau Pencatatan <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Keuangan AI WhatsApp</span>
          </h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Masuk ke dashboard untuk melihat analisis ringkasan <br /> 
            pemasukan, pengeluaran, dan riwayat transaksi real-time.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-10 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider">Back to Home</span>
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
              Welcome Back <LogIn className="text-blue-600" size={24} />
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Senang melihat Anda kembali di BalesinAI.</p>
          </div>

          <div className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email"
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5 group">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline">Lupa Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* CONDITIONAL RECAPTCHA */}
            {/* {failCount >= 3 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-3 text-amber-700">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verifikasi Tambahan Diperlukan</span>
                </div>
                <div className="flex justify-center scale-[0.9] origin-center">
                  <ReCAPTCHA
                    sitekey="6LdqUTMsAAAAABl_OU6YkHVToIvsJe2eA0_oY2Vf"
                    onChange={setCaptcha}
                  />
                </div>
              </div>
            )} */}

            {/* SUBMIT */}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2 overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign In to Dashboard <ArrowLeft className="rotate-180" size={18} /></>
              )}
            </button>

            <p className="text-center text-slate-500 text-sm mt-8 font-medium">
              Belum memiliki akun?{" "}
              <Link to="/register" className="text-blue-600 font-bold hover:underline italic">
                Daftar Gratis
              </Link>
            </p>
          </div>

          <div className="mt-16 text-center border-t border-slate-100 pt-8">
             <div className="flex justify-center gap-4">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secure Access</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Data Encrypted</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}