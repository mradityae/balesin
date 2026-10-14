import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FiTrendingUp, FiTrendingDown, FiTrash2, FiFileText, FiMessageCircle, FiCheckCircle, FiRefreshCw, FiUsers, FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

export default function FinanceAssistant() {
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserObj, setSelectedUserObj] = useState(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin") {
          setIsAdmin(true);
          fetchUsersList();
        } else {
          setIsAdmin(false);
          // Jika user biasa, langsung set ID-nya dari token login
          setSelectedUserId(decoded.uid || decoded.id);
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }
  }, []);

  const fetchUsersList = async () => {
    try {
      const res = await api.get("/admin/users");
      const allUsers = res.data || [];
      
      const now = new Date();
      const activeSubscribedUsers = allUsers.filter(
        (u) => u.subscribedUntil && new Date(u.subscribedUntil) > now
      );

      setUsersList(activeSubscribedUsers);
      setFilteredUsers(activeSubscribedUsers);

      if (activeSubscribedUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(activeSubscribedUsers[0]._id);
        setSelectedUserObj(activeSubscribedUsers[0]);
      }
    } catch (err) {
      console.error("Gagal memuat list user aktif", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const filtered = usersList.filter(
        (u) => 
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.includes(searchQuery)
      );
      setFilteredUsers(filtered);
      setCurrentUserPage(1);
    }
  }, [searchQuery, usersList, isAdmin]);

  const fetchFinance = async (userId = "", isBackground = false) => {
    try {
      // Jika admin, kirim userId. Jika user biasa, endpoint backend otomatis mengambil dari token
      const endpoint = (isAdmin && userId) ? `/finance/summary?userId=${userId}` : "/finance/summary";
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error("Gagal mengambil data keuangan", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const deleteTx = async (id) => {
    if (window.confirm("Hapus transaksi ini?")) {
      try {
        const res = await api.delete(`/finance/${id}`);
        if (res.data.success) {
          setNotification("Transaksi berhasil dihapus!");
          setTimeout(() => setNotification(""), 3000);
          fetchFinance(isAdmin ? selectedUserId : "");
        }
      } catch (err) {
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  useEffect(() => {
    if (isAdmin && selectedUserId) {
      setLoading(true);
      fetchFinance(selectedUserId);
      const found = usersList.find(u => u._id === selectedUserId);
      if (found) setSelectedUserObj(found);
    } else if (!isAdmin) {
      setLoading(true);
      fetchFinance("");
    }
  }, [selectedUserId, isAdmin]);

  // Real-time polling setiap 4 detik di background
  useEffect(() => { 
    const interval = setInterval(() => {
      if (isAdmin && selectedUserId) {
        fetchFinance(selectedUserId, true);
      } else if (!isAdmin) {
        fetchFinance("", true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedUserId, isAdmin]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndexUser = (currentUserPage - 1) * usersPerPage;
  const currentPaginatedUsers = filteredUsers.slice(startIndexUser, startIndexUser + usersPerPage);

  if (loading && !data) return <div className="p-10 text-center font-bold text-slate-500">Memuat data keuangan real-time...</div>;

  return (
    <div className="space-y-6 relative">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <FiCheckCircle size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* Jika Admin, tampilkan pemilih akun dengan pagination & search */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FiUsers className="text-emerald-600" size={20} />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Pilih Akun / User Langganan Aktif</h3>
                <p className="text-[10px] text-slate-400">Total {filteredUsers.length} user aktif ditemukan</p>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama, email, / no WA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {currentPaginatedUsers.map((u) => {
                  const isSelected = selectedUserId === u._id;
                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedUserId(u._id);
                        setLoading(true);
                      }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-emerald-50/70 border-emerald-500 shadow-sm" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{u.name} <span className="font-normal text-slate-500">({u.email})</span></p>
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">WhatsApp: +{u.phone}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        {isSelected ? "Sedang Dipantau" : "Pilih"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {totalUserPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                  <span>Hal {currentUserPage} dari {totalUserPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentUserPage(p => Math.max(p - 1, 1))}
                      disabled={currentUserPage === 1}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentUserPage(p => Math.min(p + 1, totalUserPages))}
                      disabled={currentUserPage === totalUserPages}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs font-bold text-center">
              Tidak ada user aktif yang cocok dengan pencarian.
            </div>
          )}
        </div>
      )}

      {/* Indikator Realtime Live Sync */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-600">
            Live Sync: <strong className="text-emerald-700">{isAdmin ? (selectedUserObj?.name || "Pilih User") : "Akun Anda"}</strong>
          </span>
        </div>
        <button 
          onClick={() => fetchFinance(isAdmin ? selectedUserId : "")} 
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl transition-all"
        >
          <FiRefreshCw size={14} /> Refresh Manual
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><FiTrendingUp size={24}/></div>
          <div>
            <p className="text-sm text-slate-400 font-bold">Total Pemasukan</p>
            <h3 className="text-xl font-black text-slate-800">Rp {data?.summary?.income?.toLocaleString() || 0}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full"><FiTrendingDown size={24}/></div>
          <div>
            <p className="text-sm text-slate-400 font-bold">Total Pengeluaran</p>
            <h3 className="text-xl font-black text-slate-800">Rp {data?.summary?.expense?.toLocaleString() || 0}</h3>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-700 uppercase tracking-wider text-xs">Transaksi Terbaru dari AI WhatsApp</h3>
          <span className="text-[10px] text-slate-400 font-bold">Update otomatis aktif</span>
        </div>
        <div className="divide-y">
          {data?.recentTransactions?.map((tx) => (
            <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-slate-400">
                  {tx.source === 'image' ? <FiFileText title="Dari Struk" size={18} /> : <FiMessageCircle title="Dari Chat" size={18} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{tx.items[0]?.name || tx.vendor || "Transaksi"}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('id-ID')} <span className="uppercase text-[10px] font-bold text-slate-500 ml-1">{tx.vendor}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'} Rp {tx.totalAmount.toLocaleString()}
                </p>
                <button onClick={() => deleteTx(tx._id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <div className="p-10 text-center text-slate-400 font-medium text-xs">Belum ada transaksi terdeteksi.</div>
          )}
        </div>
      </div>
    </div>
  );
}