import React, { useEffect, useState } from "react";
import api from "../services/api";
import { ShieldCheck, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

export default function FinanceWhitelistManager() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin") {
          setIsAdmin(true);
          loadUsers();
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        setIsAdmin(false);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const allUsers = res.data || [];

      // Filter hanya user yang role-nya BUKAN admin
      const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
      setUsersList(nonAdminUsers);
    } catch (err) {
      console.error("Load users error", err);
    } finally {
      setLoading(false);
    }
  };

  // ⛔ Jika bukan admin, komponen langsung hilang total (tidak merender apa pun ke user biasa)
  if (!isAdmin) {
    return null;
  }

  const totalPages = Math.ceil(usersList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = usersList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
            Whitelist Nomor Keuangan (Admin Panel)
          </h3>
          <p className="text-xs text-slate-500">
            Daftar nomor HP dari seluruh akun user (non-admin) yang otomatis menjadi whitelist sistem.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-slate-400 italic py-6">Memuat data...</p>
      ) : usersList.length === 0 ? (
        <p className="text-center text-xs text-slate-400 italic py-6">
          Belum ada user terdaftar selain admin.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {currentItems.map((u) => {
              const isSubscribed = u.subscribedUntil && new Date(u.subscribedUntil) > new Date();

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-5 py-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        +{u.phone} <span className="text-xs font-normal text-slate-500 ml-1">({u.name} - {u.email})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2 mt-0.5">
                        <span className={isSubscribed ? "text-emerald-600 font-bold flex items-center gap-1" : "text-amber-600 font-bold"}>
                          {isSubscribed ? "● Status: Aktif (Subscribed)" : "○ Status: Belum/Expired Berlangganan"}
                        </span>
                        {u.subscribedUntil && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock size={12} /> Berakhir: {new Date(u.subscribedUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${
                    isSubscribed 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {isSubscribed ? "Authorized" : "Inactive"}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-bold">
              <span>
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, usersList.length)} dari {usersList.length} user
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-black">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}