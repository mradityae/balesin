import React, { useEffect, useState } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import config from "../config";

export default function AdminPaymentProof() {

  const BASE_URL = config.BASE_URL;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/payment-proof/all");
      setList(res.data);
    } catch (err) {
      console.error("Load error:", err.response?.data);
      Swal.fire("Error", "Gagal memuat data pembayaran", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const viewImage = (fileName) => {
    Swal.fire({
      imageUrl: `${BASE_URL}${fileName}`,
      confirmButtonText: "Tutup",
    });
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
    } catch (err) {
      Swal.fire("Error", "Gagal menyetujui", "error");
    }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({
      title: "Alasan penolakan",
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      confirmButtonColor: "#d33",
    });

    if (!note) return;

    try {
      await api.post(`/payment-proof/reject/${id}`, { note });
      Swal.fire("Ditolak", "Pembayaran ditolak", "info");
      load();
    } catch (err) {
      Swal.fire("Error", "Gagal menolak", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Memuat data...</div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-bold text-xl mb-6">Verifikasi Pembayaran</h1>

      {list.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          Tidak ada pengajuan pembayaran.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {list.map((p) => {
          const imgUrl = `${BASE_URL}${p.imageUrl}`;

          return (
            <div key={p._id} className="bg-white p-4 rounded-xl shadow">

              <p className="font-semibold">
                {p.userId?.email || (
                  <span className="text-red-500">User Unknown</span>
                )}
              </p>

              <p className="text-xs text-gray-500 mb-2">
                Status:
                <b
                  className={`ml-1 ${
                    p.status === "approved"
                      ? "text-green-600"
                      : p.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {p.status}
                </b>
              </p>

              <img
                src={imgUrl}
                onClick={() => viewImage(p.imageUrl)}
                className="w-full rounded-lg border hover:opacity-80 cursor-pointer"
                alt="Bukti Pembayaran"
              />

              {p.note && (
                <p className="text-xs text-red-500 mt-2">Note: {p.note}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => approve(p._id)}
                  className="bg-green-600 text-white px-4 py-1 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(p._id)}
                  className="bg-red-600 text-white px-4 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
