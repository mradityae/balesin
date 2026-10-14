import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Swal from "sweetalert2";
import { 
  Building2, 
  Store, 
  MessageCircle, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Phone, 
  Smile, 
  Package, 
  HelpCircle,
  X
} from "lucide-react";

// Gunakan StyledSwal yang sama dengan Dashboard agar konsisten
const StyledSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] border-none shadow-2xl p-8',
    title: 'text-2xl font-black text-slate-800 tracking-tight',
    htmlContainer: 'text-slate-500 font-medium mt-2',
    confirmButton: 'rounded-2xl font-black text-[10px] px-8 py-4 uppercase tracking-[0.2em] shadow-lg focus:ring-0 mx-2',
  },
  buttonsStyling: true,
});

export default function SetupBusiness() {
  const nav = useNavigate();
  const faqBottomRef = useRef(null);
  const [planName, setPlanName] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tone: "ramah",
    adminContact: "",
    products: [],
    faq: [],
  });

  const isProductEnabled =
  planName === "Keuangan AI" || planName === "Bundle Super AI";

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

  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.get("/payment-proof/status")
      .then(res => {
        if (res.data?.status === "approved") {
          setPlanName(res.data.planName);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (planName === "CS Agent AI") {
      setForm(f => ({ ...f, products: [] }));
    }
  }, [planName]);

  const save = async () => {
    try {
      await api.post("/business", {
        ...form,
        products: isProductEnabled ? form.products : [],
      });

      StyledSwal.fire({
        icon: "success",
        title: "BERHASIL DISIMPAN",
        html: "Data bisnis Anda telah diperbarui dan siap digunakan oleh AI.",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => nav("/"), 1500);
    } catch {
      StyledSwal.fire({
        icon: "error",
        title: "GAGAL MENYIMPAN",
        html: "Terjadi kesalahan saat menyimpan profil bisnis Anda.",
      });
    }
  };

  // Fungsi Logic (Tetap Sama)
  const addProduct = () => setForm({ ...form, products: [...form.products, { name: "", description: "", price: "" }] });
  const updateProduct = (i, field, v) => {
    const x = [...form.products];
    x[i][field] = v;
    setForm({ ...form, products: x });
  };
  const removeProduct = (i) => setForm({ ...form, products: form.products.filter((_, a) => a !== i) });
  const addFaq = () => {
    setForm((p) => ({ ...p, faq: [...p.faq, { question: "", answer: "" }] }));
    setTimeout(() => { faqBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };
  const updateFaq = (i, field, v) => {
    const x = [...form.faq];
    x[i][field] = v;
    setForm({ ...form, faq: x });
  };
  const removeFaq = (i) => setForm({ ...form, faq: form.faq.filter((_, a) => a !== i) });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-blue-100">
      
      {/* STICKY HEADER ACTIONS */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => nav(-1)} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex gap-3">
             <button 
              onClick={() => nav(-1)} 
              className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={save} 
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={16} /> Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        {/* PAGE TITLE */}
        <div className="mb-12">
          <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-4">
            Knowledge Engine
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Setup Profil Bisnis</h1>
          <p className="text-slate-500 mt-2 font-medium">Informasi di bawah ini akan menjadi "otak" bagi AI WhatsApp Anda.</p>
        </div>

        <div className="grid grid-cols-1 gap-10">
          
          {/* SECTION 1: BASIC INFO */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-slate-50/50 -mr-4 -mt-4">
               <Building2 size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100"><Store size={20}/></div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Informasi Dasar</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nama Bisnis</label>
                  <input
                    placeholder="Contoh: Kopi Senja Digital"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Deskripsi & Tentang Bisnis</label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan bisnis Anda, apa yang dijual, dan keunggulannya..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Gaya Bicara AI (Tone)</label>
                    <div className="relative">
                       <Smile className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold outline-none focus:border-blue-500 focus:bg-white appearance-none transition-all"
                        value={form.tone}
                        onChange={(e) => setForm({ ...form, tone: e.target.value })}
                      >
                        <option value="ramah">😊 Ramah & Friendly</option>
                        <option value="formal">💼 Profesional & Formal</option>
                        <option value="santai">🤙 Santai & Gaul</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Kontak Admin (WhatsApp)</label>
                    <div className="relative">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input
                        placeholder="62812xxx"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                        value={form.adminContact}
                        onChange={(e) => setForm({ ...form, adminContact: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: FAQ */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100"><HelpCircle size={20}/></div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">FAQ (Tanya Jawab)</h2>
              </div>
              <button 
                onClick={addFaq} 
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Plus size={14} /> Tambah FAQ
              </button>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {form.faq.map((f, i) => (
                <div key={i} className="bg-slate-50 border-l-4 border-l-emerald-500 rounded-2xl p-6 relative">
                  <button 
                    onClick={() => removeFaq(i)} 
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Pertanyaan Pelanggan</label>
                      <input
                        placeholder="Contoh: Apakah bisa COD?"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold text-sm outline-none focus:border-emerald-500"
                        value={f.question}
                        onChange={(e) => updateFaq(i, "question", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Jawaban AI</label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Maaf, untuk saat ini kami hanya melayani pembayaran via Transfer..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 text-sm font-medium outline-none focus:border-emerald-500"
                        value={f.answer}
                        onChange={(e) => updateFaq(i, "answer", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div ref={faqBottomRef}></div>
            </div>
          </section>

          {/* SECTION 2: PRODUCTS */}
          {isProductEnabled && (
            <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><Package size={20}/></div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Katalog Produk (Opsional)</h2>
                </div>
                <button 
                  onClick={addProduct} 
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <Plus size={14} /> Tambah Produk
                </button>
              </div>

              <div className="space-y-4">
                {form.products.map((p, i) => (
                  <div key={i} className="group relative bg-slate-50 border border-slate-200 rounded-3xl p-6 hover:border-indigo-300 hover:bg-white transition-all duration-300">
                    <button 
                      onClick={() => removeProduct(i)} 
                      className="absolute -top-2 -right-2 bg-white border border-slate-200 text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-1">
                        <input
                          placeholder="Nama Produk"
                          className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 font-bold outline-none focus:border-indigo-500 transition-all"
                          value={p.name}
                          onChange={(e) => updateProduct(i, "name", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-1 text-right">
                        <input
                          placeholder="Harga (Contoh: 50rb)"
                          className="w-full bg-transparent border-b border-slate-200 py-2 text-indigo-600 font-black text-right outline-none focus:border-indigo-500 transition-all"
                          value={p.price}
                          onChange={(e) => updateProduct(i, "price", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 mt-2">
                        <textarea
                          rows={1}
                          placeholder="Deskripsi singkat produk..."
                          className="w-full bg-transparent border-b border-slate-100 py-2 text-slate-500 text-xs font-medium outline-none focus:border-indigo-500 transition-all italic"
                          value={p.description}
                          onChange={(e) => updateProduct(i, "description", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {form.products.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-slate-400 text-xs font-medium italic">Produk dapat ditambahkan di deskripsi dan tentang bisnis</p>
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}