import React, { useEffect, useState } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import config from "../config";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const BASE_URL = config.BASE_URL;
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/users");
    const paymentProof = await api.get("/payment-proof/all");

    const merged = res.data.map((u) => {
      const proof = paymentProof.data.find(
        (p) => p.userId?._id === u._id
      );

      return {
        ...u,
        proofStatus: proof?.status || "none",
        proofImage: proof?.imageUrl || null,
        proofId: proof?._id || null,
        proofNote: proof?.note || "",
        planName: proof?.planName || "-",
        duration: proof?.duration || 0,
        totalPaid: proof?.totalPaid || 0,
      };
    });

    setUsers(merged);
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activate = async (id) => {
    const { value: days } = await Swal.fire({
      title: "Durasi Subscription",
      input: "number",
      inputValue: 30,
      showCancelButton: true,
      confirmButtonText: "Aktifkan",
      background: "#0f172a",
      color: "#fff",
    });

    if (!days) return;

    setLoading(true);
    try {
      await api.post("/admin/activate-subscription", {
        userId: id,
        days: Number(days),
      });

      Swal.fire({
        icon: "success",
        text: "Subscription diaktifkan",
        background: "#0f172a",
        color: "#fff",
      });
      load();
    } catch (err) {
      Swal.fire("Error", "Gagal mengaktifkan", "error");
    } finally {
      setLoading(false);
    }
  };

  const showProof = async (user) => {
    if (!user.proofImage) return Swal.fire("Tidak ada bukti bayar", "", "info");

    const imgUrl = `${BASE_URL}${user.proofImage}`;
    const isApproved = user.proofStatus === "approved";

    const result = await Swal.fire({
      title: user.email,
      html: `
        <img src="${imgUrl}" style="width:100%;border-radius:10px;margin-bottom:10px"/>
        <div style="text-align: left; font-size: 14px; background: #f4f4f4; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 5px 0;">Paket: <b>${user.planName}</b></p>
            <p style="margin: 5px 0;">Durasi: <b>${user.duration} Bulan</b></p>
            <p style="margin: 5px 0;">Total Bayar: <b>Rp ${user.totalPaid.toLocaleString()}</b></p>
        </div>
        <p>Status: <b style="color: ${isApproved ? 'green' : 'orange'}">${user.proofStatus.toUpperCase()}</b></p>
        ${user.proofNote ? `<p>Catatan: ${user.proofNote}</p>` : ""}
      `,
      showCancelButton: true,
      showDenyButton: !isApproved,
      confirmButtonText: isApproved ? "Tutup" : "Approve",
      denyButtonText: "Reject",
      cancelButtonText: "Kembali",
      width: 400
    });

    if (!isApproved) {
      if (result.isConfirmed) return approve(user);
      if (result.isDenied) return reject(user.proofId);
    }
  };

  const approve = async (user) => {
    const { value: note } = await Swal.fire({
      title: "Catatan (opsional)",
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Setujui",
    });

    if (note === undefined) return;

    try {
      await api.post(`/payment-proof/approve/${user.proofId}`, { note });
      const days = user.duration * 30;
      await api.post("/admin/activate-subscription", {
        userId: user._id,
        days: days,
      });

      Swal.fire("Berhasil", "Pembayaran disetujui & Subscription aktif", "success");
      load();
    } catch {
      Swal.fire("Error", "Gagal menyetujui", "error");
    }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({
      title: "Alasan penolakan",
      input: "text",
      inputPlaceholder: "Masukkan alasan...",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      confirmButtonColor: "#d33",
      inputValidator: (v) => !v && "Alasan penolakan wajib diisi!"
    });

    if (!note) return;

    try {
      await api.post(`/payment-proof/reject/${id}`, { note });
      Swal.fire("Ditolak", "Pembayaran ditolak", "info");
      load();
    } catch {
      Swal.fire("Error", "Gagal menolak", "error");
    }
  };

  const deactivate = async (user) => {
    const yes = await Swal.fire({
      title: "Nonaktifkan user?",
      text: "Status pembayaran akan menjadi EXPIRED dan session bot akan di-reset.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Nonaktifkan",
      background: "#0f172a",
      color: "#fff",
    });

    if (!yes.isConfirmed) return;

    setLoading(true);
    try {
      await api.post("/bot/reset-session", { userId: user._id });
      Swal.fire({ icon: "success", text: "User dinonaktifkan", background: "#0f172a", color: "#fff" });
      load();
    } catch {
      Swal.fire({ icon: "error", text: "Gagal menonaktifkan", background: "#0f172a", color: "#fff" });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    const yes = await Swal.fire({
      title: "Hapus user?",
      text: "Semua data user dan bot akan hilang",
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      background: "#0f172a",
      color: "#fff",
    });

    if (!yes.isConfirmed) return;

    setLoading(true);
    try {
      await api.post("/admin/delete-user", { userId: id });
      Swal.fire({ icon: "success", text: "User dihapus", background: "#0f172a", color: "#fff" });
      load();
    } catch {
      Swal.fire({ icon: "error", text: "Gagal menghapus", background: "#0f172a", color: "#fff" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10 text-gray-900">
      <TopBar title="Admin Panel" subtitle="Kelola user & pembayaran" variant="admin" />

      <div className="max-w-6xl mx-auto flex gap-4 mt-10 mb-5">
        <button onClick={() => navigate("/dashboard")} className="bg-white border px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 transition-all">← Dashboard</button>
        <button onClick={() => navigate("/admin/payment-proof")} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition-all">Cek Bukti Pembayaran</button>
      </div>

      <div className="max-w-6xl mx-auto flex justify-start mb-8">
        <input
          placeholder="Cari user..."
          className="bg-white border px-4 py-3 rounded-lg w-72 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="max-w-6xl mx-auto bg-white border rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-800 min-w-[800px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-center font-semibold">Role</th>
                <th className="p-4 text-center font-semibold">Subscription</th>
                <th className="p-4 text-center font-semibold">Paket</th>
                <th className="p-4 text-center font-semibold">Status Pembayaran</th>
                <th className="p-4 text-center font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {users
                .filter((u) => u.email.toLowerCase().includes(filter.toLowerCase()))
                .map((u, i) => (
                  <tr key={u._id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b`}>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-gray-200'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {u.subscribedUntil ? new Date(u.subscribedUntil).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-blue-600">
                      {u.planName !== "-" ? `${u.planName} (${u.duration} bln)` : "—"}
                    </td>

                    <td className="p-4 text-center font-semibold">
                      {u.proofStatus === "pending" && <span className="text-yellow-600">Pending</span>}
                      {u.proofStatus === "approved" && <span className="text-green-600">Approved</span>}
                      {u.proofStatus === "rejected" && <span className="text-red-600">Rejected</span>}
                      {u.proofStatus === "expired" && <span className="text-red-600">Expired</span>}
                      {u.proofStatus === "none" && <span className="text-gray-400">—</span>}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center items-center gap-3">
                        {u.proofImage ? (
                          <button onClick={() => showProof(u)} className="bg-purple-600 text-white px-3 py-1 rounded text-xs min-w-[90px]">Bukti Bayar</button>
                        ) : (
                          <span className="text-gray-400 text-xs min-w-[90px] text-center">No Proof</span>
                        )}

                        <button
                          disabled={loading}
                          onClick={() => activate(u._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs min-w-[75px] hover:bg-blue-700"
                        >
                          Activate
                        </button>

                        <button
                          disabled={loading}
                          onClick={() => deactivate(u)}
                          className="bg-gray-800 text-white px-3 py-1 rounded text-xs min-w-[75px] hover:bg-black"
                        >
                          Deactivate
                        </button>

                        <button
                          disabled={loading || u.role === "admin" || (u.subscribedUntil && new Date(u.subscribedUntil) > new Date())}
                          onClick={() => deleteUser(u._id)}
                          className={`text-xs px-3 py-1 rounded min-w-[75px] ${
                            loading || u.role === "admin" || (u.subscribedUntil && new Date(u.subscribedUntil) > new Date())
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                            : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}