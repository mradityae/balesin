import React, { useEffect, useState } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";
import config from "../config";

export default function Admin() {
  const BASE_URL = config.BASE_URL;

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/users");
    const paymentProof = await api.get("/payment-proof/all");

    // Gabungkan data user + payment proof
    const merged = res.data.map((u) => {
      const proof = paymentProof.data.find(
        (p) => p.userId?._id === u._id
      );

      return {
        ...u,
        proofStatus: proof?.status || "none", // pending / approved / rejected / none
        proofImage: proof?.imageUrl || null,
        proofId: proof?._id || null,
        proofNote: proof?.note || "",
      };
    });

    setUsers(merged);
  };

  useEffect(() => {
    load();

    // AUTO REFRESH TIAP 3 DETIK
    const interval = setInterval(() => {
      load();
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  const showProof = async (user) => {
    if (!user.proofImage) {
      return Swal.fire("Tidak ada bukti bayar", "", "info");
    }

    const imgUrl = `${BASE_URL}${user.proofImage}`;

    const result = await Swal.fire({
      title: user.email,
      html: `
        <img src="${imgUrl}" style="width:100%;border-radius:10px;margin-bottom:10px"/>
        <p>Status: <b>${user.proofStatus}</b></p>
        ${user.proofNote ? `<p>Catatan: ${user.proofNote}</p>` : ""}
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Approve",
      denyButtonText: "Reject",
      cancelButtonText: "Tutup",
      width: 400
    });

    if (result.isConfirmed) return approve(user.proofId);
    if (result.isDenied) return reject(user.proofId);
  };

  const approve = async (id) => {
    const { value: note } = await Swal.fire({
      title: "Catatan (opsional)",
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Setujui",
    });

    try {
      await api.post(`/payment-proof/approve/${id}`, { note });
      Swal.fire("Berhasil", "Pembayaran disetujui", "success");
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
      inputValidator: (value) => {
        if (!value) {
          return "Alasan penolakan wajib diisi!";
        }
      }
    });

    try {
      await api.post(`/payment-proof/reject/${id}`, { note });
      Swal.fire("Ditolak", "Pembayaran ditolak", "info");
      load();
    } catch {
      Swal.fire("Error", "Gagal menolak", "error");
    }
  };


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
    await api.post("/admin/activate-subscription", {
      userId: id,
      days: Number(days),
    });

    setLoading(false);

    Swal.fire({
      icon: "success",
      text: "Subscription diaktifkan",
      background: "#0f172a",
      color: "#fff",
    });
    load();
  };

  const deactivate = async (id) => {
    const yes = await Swal.fire({
      title: "Nonaktifkan user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      background: "#0f172a",
      color: "#fff",
    });

    if (!yes.isConfirmed) return;

    setLoading(true);
    try {
      await api.post("/bot/reset-session", { userId: id });
      Swal.fire({
        icon: "success",
        text: "User dinonaktifkan",
        background: "#0f172a",
        color: "#fff",
      });
      load();
    } catch {
      Swal.fire({
        icon: "error",
        text: "Tidak dapat reset session",
        background: "#0f172a",
        color: "#fff",
      });
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
      Swal.fire({
        icon: "success",
        text: "User dihapus",
        background: "#0f172a",
        color: "#fff",
      });
      load();
    } catch {
      Swal.fire({
        icon: "error",
        text: "Tidak dapat menghapus user",
        background: "#0f172a",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10 text-gray-900">

      <TopBar title="Admin Panel" subtitle="Kelola user & pembayaran" variant="admin" />

      {/* Search */}
      <div className="max-w-6xl mx-auto flex justify-start mb-8">
        <input
          placeholder="Cari user..."
          className="bg-white border px-4 py-3 rounded-lg w-72 shadow-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* TABLE CARD */}
      <div className="max-w-6xl mx-auto bg-white border rounded-xl overflow-hidden shadow">
        <table className="w-full text-sm text-gray-800">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 text-left font-semibold">Email</th>
              <th className="p-4 text-center font-semibold">Role</th>
              <th className="p-4 text-center font-semibold">Subscription</th>
              <th className="p-4 text-center font-semibold">Status Pembayaran</th>
              <th className="p-4 text-center font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {users
              .filter((u) =>
                u.email.toLowerCase().includes(filter.toLowerCase())
              )
              .map((u, i) => (
                <tr
                  key={u._id}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } border-b`}
                >
                  <td className="p-4">{u.email}</td>

                  <td className="p-4 text-center">
                    <span className="bg-gray-200 px-3 py-1 rounded-full text-xs">
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {u.subscribedUntil
                      ? new Date(u.subscribedUntil).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* STATUS PEMBAYARAN */}
                  <td className="p-4 text-center">
                    {u.proofStatus === "pending" && (
                      <span className="text-yellow-600 font-semibold">
                        Pending
                      </span>
                    )}
                    {u.proofStatus === "approved" && (
                      <span className="text-green-600 font-semibold">
                        Approved
                      </span>
                    )}
                    {u.proofStatus === "rejected" && (
                      <span className="text-red-600 font-semibold">
                        Rejected
                      </span>
                    )}
                    {u.proofStatus === "expired" && (
                      <span className="text-red-600 font-semibold">
                        Expired
                      </span>
                    )}
                    {u.proofStatus === "none" && (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-3">

                      {u.proofImage ? (
                        <button
                          onClick={() => showProof(u)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-xs min-w-[90px] text-center"
                        >
                          Bukti Bayar
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs min-w-[90px] text-center inline-block">
                          No Proof
                        </span>
                      )}

                      <button
                        disabled={loading}
                        onClick={() => activate(u._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs min-w-[75px] text-center"
                      >
                        Activate
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => deactivate(u._id)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-xs min-w-[75px] text-center"
                      >
                        Disable
                      </button>

                      <button
                        disabled={
                          loading ||
                          (u.subscribedUntil &&
                            new Date(u.subscribedUntil) > new Date())
                        }
                        onClick={() => deleteUser(u._id)}
                        className={`text-xs px-3 py-1 rounded min-w-[75px] text-center ${
                          u.subscribedUntil
                            ? "bg-gray-300 text-gray-500"
                            : "bg-red-600 text-white"
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

        {users.length === 0 && (
          <p className="p-6 text-center text-gray-500">Tidak ada user ditemukan.</p>
        )}
      </div>
    </div>
  );
}
