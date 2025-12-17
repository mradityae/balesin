import React from "react";
import { useEffect, useState } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  };

  const activate = async (id) => {
    const days = prompt("Aktifkan subscription berapa hari?", "30");
    if (!days) return;

    setLoading(true);
    await api.post("/admin/activate-subscription", {
      userId: id,
      days: Number(days),
    });
    setLoading(false);
    alert("Subscription diaktifkan");
    load();
  };

  const deactivate = async (id) => {
    if (!confirm("Yakin nonaktifkan user ini?")) return;

    setLoading(true);
    try {
      await api.post("/bot/reset-session", { userId: id });
      alert("User dinonaktifkan & session di-reset");
      load();
    } catch {
      alert("Gagal reset session");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("⚠️ User akan dihapus permanen dan bot akan dimatikan. Lanjutkan?")) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/admin/delete-user", { userId: id });
      alert("User berhasil dihapus & bot dimatikan");
      load();
    } catch {
      alert("Gagal menghapus user");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TopBar
        title="Admin – Users"
        subtitle="Kelola user dan subscription"
        variant="admin"
      />

      <div className="max-w-6xl mx-auto bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Role</th>
              <th className="p-3 text-center">Subscription</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-1 text-xs rounded bg-gray-100">
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {u.subscribedUntil
                    ? new Date(u.subscribedUntil).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-center space-x-2">
                  <button
                    disabled={loading}
                    onClick={() => activate(u._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Activate
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => deactivate(u._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Deactivate
                  </button>
                  <button
                    disabled={loading || (u.subscribedUntil && new Date(u.subscribedUntil) > new Date())}
                    onClick={() => deleteUser(u._id)}
                    className={`px-3 py-1 rounded text-xs text-white ${
                      u.subscribedUntil
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-700 hover:bg-red-800"
                    }`}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
