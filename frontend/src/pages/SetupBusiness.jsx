import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Swal from "sweetalert2";


export default function SetupBusiness() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    tone: "ramah",
    adminContact: "",
    products: [],
    faq: [],
  });

  /* ================= LOAD ================= */
  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= SAVE ================= */
  const save = async () => {
    try {
      await api.post("/business", form);
      Swal.fire({
        icon: "success",
        text: "Profil bisnis berhasil disimpan",
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


  /* ================= PRODUCT ================= */
  const addProduct = () => {
    setForm({
      ...form,
      products: [...form.products, { name: "", description: "", price: "" }],
    });
  };

  const updateProduct = (i, field, value) => {
    const products = [...form.products];
    products[i][field] = value;
    setForm({ ...form, products });
  };

  const removeProduct = (i) => {
    setForm({
      ...form,
      products: form.products.filter((_, idx) => idx !== i),
    });
  };

  /* ================= FAQ ================= */
  const addFaq = () => {
    setForm({
      ...form,
      faq: [...form.faq, { question: "", answer: "" }],
    });
  };

  const updateFaq = (i, field, value) => {
    const faq = [...form.faq];
    faq[i][field] = value;
    setForm({ ...form, faq });
  };

  const removeFaq = (i) => {
    setForm({
      ...form,
      faq: form.faq.filter((_, idx) => idx !== i),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Setup Profil Bisnis
            </h1>
            <p className="text-sm text-slate-500">
              Informasi ini digunakan AI untuk membalas pesan pelanggan
            </p>
          </div>

          <button
            onClick={() => nav(-1)}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            ← Kembali
          </button>
        </div>

        {/* BASIC INFO */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="font-semibold mb-4 text-slate-700">
            Informasi Dasar
          </h2>

          <input
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nama Bisnis"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <textarea
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Deskripsi Bisnis"
            rows={3}
            value={form.description}
            onChange={e =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.tone}
              onChange={e => setForm({ ...form, tone: e.target.value })}
            >
              <option value="ramah">Ramah</option>
              <option value="formal">Formal</option>
              <option value="santai">Santai</option>
            </select>

            <input
              className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Kontak Admin (opsional)"
              value={form.adminContact}
              onChange={e =>
                setForm({ ...form, adminContact: e.target.value })
              }
            />
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="font-semibold mb-4 text-slate-700">
            Produk / Layanan
          </h2>

          {form.products.map((p, i) => (
            <div
              key={i}
              className="border rounded-xl p-4 mb-4 bg-slate-50"
            >
              <input
                className="w-full border rounded-lg px-3 py-2 mb-2"
                placeholder="Nama Produk"
                value={p.name}
                onChange={e =>
                  updateProduct(i, "name", e.target.value)
                }
              />
              <input
                className="w-full border rounded-lg px-3 py-2 mb-2"
                placeholder="Deskripsi Produk"
                value={p.description}
                onChange={e =>
                  updateProduct(i, "description", e.target.value)
                }
              />
              <input
                className="w-full border rounded-lg px-3 py-2 mb-2"
                placeholder="Harga"
                value={p.price}
                onChange={e =>
                  updateProduct(i, "price", e.target.value)
                }
              />

              <button
                onClick={() => removeProduct(i)}
                className="text-xs text-red-600 hover:underline"
              >
                Hapus Produk
              </button>
            </div>
          ))}

          <button
            onClick={addProduct}
            className="text-sm text-blue-600 hover:underline"
          >
            + Tambah Produk
          </button>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="font-semibold mb-4 text-slate-700">FAQ</h2>

          {form.faq.map((f, i) => (
            <div
              key={i}
              className="border rounded-xl p-4 mb-4 bg-slate-50"
            >
              <input
                className="w-full border rounded-lg px-3 py-2 mb-2"
                placeholder="Pertanyaan"
                value={f.question}
                onChange={e =>
                  updateFaq(i, "question", e.target.value)
                }
              />
              <textarea
                className="w-full border rounded-lg px-3 py-2 mb-2"
                placeholder="Jawaban"
                rows={2}
                value={f.answer}
                onChange={e =>
                  updateFaq(i, "answer", e.target.value)
                }
              />

              <button
                onClick={() => removeFaq(i)}
                className="text-xs text-red-600 hover:underline"
              >
                Hapus FAQ
              </button>
            </div>
          ))}

          <button
            onClick={addFaq}
            className="text-sm text-blue-600 hover:underline"
          >
            + Tambah FAQ
          </button>
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => nav(-1)}
            className="px-6 py-2 rounded-lg border text-slate-600 hover:bg-slate-100"
          >
            Kembali
          </button>

          <button
            onClick={save}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Simpan Profil Bisnis
          </button>
        </div>
      </div>
    </div>
  );

}
