import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import FinanceAssistant from "../components/FinanceAssistant";
import FinanceWhitelistManager from "../components/FinanceWhitelistManager";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft } from "lucide-react";

export default function FinancePage() {
  const [userRole, setUserRole] = React.useState("");
  const nav = useNavigate();

  React.useEffect(() => {
    const token = getToken();
    if (!token) { nav("/login"); return; }
    try {
      const data = jwtDecode(token);
      setUserRole(data.role);
    } catch { nav("/login"); }
  }, [nav]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 pb-20">
      
      {/* HEADER AREA */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => nav("/dashboard")}
              className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-emerald-600 transition-colors bg-slate-100 px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              AI Finance Active
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
        <FinanceWhitelistManager role={userRole} />
        <FinanceAssistant />
      </div>
    </div>
  );
}