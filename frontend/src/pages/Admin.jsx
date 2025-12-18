import React, { useEffect, useState } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import Swal from "sweetalert2";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  };

  const activate = async (id) => {
    const { value: days } = await Swal.fire({
      title: "Durasi Subscription",
      input: "number",
      inputValue: 30,
      background: "#0f172a",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Aktifkan",
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
      background: "#0f172a",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Ya",
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
      background: "#0f172a",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Hapus",
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

  useEffect(() => {
    load();
  }, []);

  return (
  <div className="min-h-screen bg-gray-100 p-10 text-gray-900">

    <TopBar
      title="Admin Panel"
      subtitle="Kelola user & subscription"
      variant="admin"
    />

    {/* Search */}
    <div className="max-w-6xl mx-auto flex justify-start mb-8">
      <input
        placeholder="Cari user..."
        className="
          bg-white
          border border-gray-300
          px-4 py-3 
          rounded-lg
          w-72
          text-gray-700
          placeholder-gray-400
          outline-none
          focus:border-blue-500
          shadow-sm
        "
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </div>

    {/* TABLE CARD */}
    <div
      className="
        max-w-6xl mx-auto 
        bg-white  
        border border-gray-200 
        rounded-xl 
        overflow-hidden 
        shadow
      "
    >
      <table className="w-full text-sm text-gray-800">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="p-4 text-left font-semibold">Email</th>
            <th className="p-4 text-center font-semibold">Role</th>
            <th className="p-4 text-center font-semibold">Subscription</th>
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
                } border-b border-gray-200`}
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

                <td className="p-4 flex justify-center gap-3">

                  <button
                    disabled={loading}
                    onClick={() => activate(u._id)}
                    className="
                      bg-blue-600 
                      hover:bg-blue-700
                      text-white 
                      px-3 py-1 
                      rounded 
                      text-xs 
                      shadow-sm
                      transition
                    "
                  >
                    Activate
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => deactivate(u._id)}
                    className="
                      bg-yellow-500 
                      hover:bg-yellow-600 
                      text-white
                      px-3 py-1 
                      rounded 
                      text-xs 
                      shadow-sm
                      transition
                    "
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
                    className={`
                      text-xs px-3 py-1 rounded shadow-sm transition
                      ${
                        u.subscribedUntil
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }
                    `}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="p-6 text-center text-gray-500">
          Tidak ada user ditemukan.
        </p>
      )}
    </div>
  </div>
);

}
