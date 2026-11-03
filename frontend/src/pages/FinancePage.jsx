import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import FinanceAssistant from "../components/FinanceAssistant";
import FinanceWhitelistManager from "../components/FinanceWhitelistManager";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

export default function FinancePage() {
  const [userRole, setUserRole] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const nav = useNavigate();

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      nav("/login");
      return;
    }

    try {
      const data = jwtDecode(token);

      // Validasi masa kedaluwarsa token (exp dalam detik)
      if (data && data.exp && data.exp * 1000 < Date.now()) {
        nav("/login");
        return;
      }

      setUserRole(data?.role || "User");
    } catch {
      nav("/login");
    } finally {
      setIsLoading(false);
    }
  }, [nav]);

  // Tampilkan loading screen minimalis saat verifikasi token berjalan
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
          <Loader2 className="animate-spin text-emerald-600" size={20} />
          <span>Memuat Konsol Keuangan...</span>
        </div>
      </div>
    );
  }

  // Cek apakah role memiliki hak akses admin/whitelist manager (sesuaikan kebutuhan)
  const isAdminRole = ["admin", "superadmin", "manager"].includes(userRole?.toLowerCase());

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 pb-20">
      
      {/* HEADER AREA */}
      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => nav("/dashboard")}
              className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-emerald-600 transition-colors bg-slate-100 px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
            
            <div className="flex items-center gap-2">
              {/* Badge Role Pengguna */}
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-slate-200">
                <ShieldCheck size={12} className="text-emerald-600" />
                Role: {userRole}
              </div>

              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                AI Finance Active
              </div>
            </div>
          </div>
          
          <TopBar
            title="Keuangan AI Console"
            subtitle="Pusat Laporan & Manajemen Keuangan Usaha"
            variant="user"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Render FinanceWhitelistManager hanya jika role memenuhi syarat (Opsional/Role Guard) */}
        {isAdminRole ? (
          <FinanceWhitelistManager role={userRole} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl text-xs font-semibold">
            Catatan: Menu Manajemen Whitelist dibatasi khusus untuk Administrator/Manager.
          </div>
        )}

        <FinanceAssistant />
      </div>
    </div>
  );
}