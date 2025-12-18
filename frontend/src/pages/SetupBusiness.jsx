import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Swal from "sweetalert2";

export default function SetupBusiness() {
  const nav = useNavigate();

  const faqBottomRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tone: "ramah",
    adminContact: "",
    products: [],
    faq: [],
  });

  const load = async () => {
    try {
      const res = await api.get("/business");
      if (res.data) {
        setForm({
          name: res.data.name || "",
          description: res.data.description || "",
          tone: res.data.tone || "ramah",
          adminContact: res.data.adminContact || "",
          products: res.data.products || [],
          faq: res.data.faq || [],
        });
      }
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api.post("/business", form);

      Swal.fire({
        icon: "success",
        text: "Profil bisnis berhasil disimpan!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => nav("/"), 1500);
    } catch {
      Swal.fire({
        icon: "error",
        text: "Gagal menyimpan profil bisnis",
      });
    }
  };

  const addProduct = () =>
    setForm({
      ...form,
      products: [...form.products, { name: "", description: "", price: "" }],
    });

  const updateProduct = (i, field, v) => {
    const x = [...form.products];
    x[i][field] = v;
    setForm({ ...form, products: x });
  };

  const removeProduct = (i) =>
    setForm({
      ...form,
      products: form.products.filter((_, a) => a !== i),
    });

  const addFaq = () => {
    setForm((prev) => {
      const updated = {
        ...prev,
        faq: [...prev.faq, { question: "", answer: "" }],
      };

      setTimeout(() => {
        faqBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 30);

      return updated;
    });
  };

  const updateFaq = (i, field, v) => {
    const x = [...form.faq];
    x[i][field] = v;
    setForm({ ...form, faq: x });
  };

  const removeFaq = (i) =>
    setForm({
      ...form,
      faq: form.faq.filter((_, a) => a !== i),
    });

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Setup Profil Bisnis
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Informasi ini dipakai AI WhatsApp untuk membalas pelanggan.
            </p>
          </div>

          <button
            onClick={() => nav(-1)}
            className="text-sm text-gray-600 hover:text-black transition"
          >
            ← Kembali
          </button>
        </div>

        {/* BASIC INFO */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-10 shadow-sm">
          <h2 className="font-semibold text-lg mb-6 text-gray-700">
            Informasi Dasar
          </h2>

          {/* NAME */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Bisnis
          </label>
          <input
            className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 mb-6 text-gray-800 outline-none focus:border-blue-500 shadow-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* DESCRIPTION */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi Bisnis
          </label>
          <textarea
            rows={5}
            className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 mb-6 text-gray-800 outline-none focus:border-blue-500 shadow-sm"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* TONE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gaya Bicara AI
              </label>
              <select
                className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
              >
                <option value="ramah">Ramah</option>
                <option value="formal">Formal</option>
                <option value="santai">Santai</option>
              </select>
            </div>

            {/* ADMIN CONTACT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontak Admin (Opsional)
              </label>
              <input
                className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                value={form.adminContact}
                onChange={(e) =>
                  setForm({ ...form, adminContact: e.target.value })
                }
              />
            </div>

          </div>
        </div>

        {/* PRODUCTS */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-10 shadow-sm">
          <h2 className="font-semibold text-lg mb-6 text-gray-700">
            Produk / Layanan
          </h2>

          {form.products.map((p, i) => (
            <div
              key={i}
              className="border border-gray-200 bg-gray-50 rounded-xl px-5 py-4 mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Produk
              </label>
              <input
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-500 shadow-sm"
                value={p.name}
                onChange={(e) => updateProduct(i, "name", e.target.value)}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi Produk
              </label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-500 shadow-sm"
                value={p.description}
                onChange={(e) => updateProduct(i, "description", e.target.value)}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga
              </label>
              <input
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 mb-3 outline-none focus:border-blue-500 shadow-sm"
                value={p.price}
                onChange={(e) => updateProduct(i, "price", e.target.value)}
              />

              <button
                onClick={() => removeProduct(i)}
                className="text-xs text-red-500 hover:underline"
              >
                Hapus Produk
              </button>
            </div>
          ))}

          <button
            onClick={addProduct}
            className="text-blue-600 hover:underline text-sm"
          >
            + Tambah Produk
          </button>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-10 shadow-sm">
          <h2 className="font-semibold text-lg mb-6 text-gray-700">
            FAQ
          </h2>

          {/* SCROLL WRAPPER */}
          <div
            className="max-h-96 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400/50"
          >
            {form.faq.map((f, i) => (
              <div
                key={i}
                className="border border-gray-200 bg-gray-50 rounded-xl px-5 py-4"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pertanyaan
                </label>
                <input
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-500 shadow-sm"
                  value={f.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jawaban
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 mb-3 outline-none focus:border-blue-500 shadow-sm"
                  value={f.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                />

                <button
                  onClick={() => removeFaq(i)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Hapus FAQ
                </button>
              </div>
            ))}

            <div ref={faqBottomRef}></div>
          </div>

          <button
            onClick={addFaq}
            className="mt-6 text-blue-600 hover:underline text-sm"
          >
            + Tambah FAQ
          </button>
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => nav(-1)}
            className="px-6 py-3 rounded-lg text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
          >
            Batal
          </button>

          <button
            onClick={save}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Simpan Profil
          </button>
        </div>

      </div>
    </div>
  );
}
