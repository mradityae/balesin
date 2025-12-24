import React, { useState } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

export default function PaymentProof() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return Swal.fire("Oops", "Pilih gambar dulu", "warning");

    setLoading(true);

    const fd = new FormData();
    const token = getToken();
    const decoded = jwtDecode(token);

    fd.append("userId", decoded.uid);
    fd.append("image", file);

    try {
      await api.post("/payment-proof/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      Swal.fire({
        icon: "success",
        title: "Upload Berhasil!",
        text: "Bukti pembayaran telah dikirim ke admin.",
        confirmButtonColor: "#2563eb",
      });

      nav("/dashboard");

    } catch (err) {
      console.log("UPLOAD ERROR:", err.response?.data);
      Swal.fire("Gagal", "Upload error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">

    {/* Back Button */}
    <button
      onClick={() => nav(-1)}
      className="self-start mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm font-medium">Kembali</span>
    </button>

    {/* CARD */}
    <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 animate-fadeIn">

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Upload Bukti Pembayaran
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Silakan unggah bukti transfer untuk mengaktifkan akun Anda.
      </p>

      {/* Upload area */}
      <label
        className="border-2 border-dashed border-gray-300 hover:border-blue-500 
                   transition cursor-pointer rounded-xl p-6 flex flex-col 
                   items-center gap-3 bg-gray-50"
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16.5 10.5L12 6l-4.5 4.5M12 6v13"
          />
        </svg>

        <p className="text-gray-500 text-sm text-center">
          Klik di sini untuk memilih gambar<br />
          <span className="text-xs">(JPEG/PNG max 5MB)</span>
        </p>

        <input type="file" className="hidden" onChange={handleFile} />
      </label>

      {preview && (
        <div className="mt-5">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <img
            src={preview}
            alt="preview"
            className="w-full rounded-xl border shadow-sm"
          />
        </div>
      )}

      <button
        onClick={upload}
        disabled={loading}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 
                   text-white py-3 rounded-xl shadow-lg text-sm font-semibold
                   transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {loading ? "Mengupload..." : "Kirim Bukti Pembayaran"}
      </button>

    </div>
  </div>
);

}
