import { useState } from "react";
import React from "react";

export default function ApiConfig() {
  const [endpoint, setEndpoint] = useState(
    localStorage.getItem("API_BASE_URL") || ""
  );

  const save = () => {
    if (endpoint) {
      localStorage.setItem("API_BASE_URL", endpoint);
    } else {
      localStorage.removeItem("API_BASE_URL");
    }
    alert("Endpoint berhasil disimpan");
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f6f7fb",
        padding: 16
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>🔗 Koneksi Balesin</h2>
          <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
            Atur alamat server agar Balesin bisa balas chat pelanggan.
          </p>
        </div>

        {/* INPUT */}
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "block",
            marginBottom: 6
          }}
        >
          API Endpoint
        </label>

        <input
          placeholder="https://xxxx.trycloudflare.com"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
            outline: "none"
          }}
        />

        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#777"
          }}
        >
          Kosongkan jika menggunakan <b>localhost</b>
        </p>

        {/* BUTTON */}
        <button
          onClick={save}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: "#22c55e",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
