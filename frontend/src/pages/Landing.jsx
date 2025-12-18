import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Landing() {

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const targets = document.querySelectorAll(".scroll-fade");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0", "translate-y-6");
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    });

    targets.forEach((el) => obs.observe(el));
  }, []);

  return (
    <div className="bg-white text-slate-800 font-inter overflow-hidden">

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">

          <h1
            className="text-3xl tracking-tight font-extrabold text-blue-600 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => scrollTo("body")}
          >
            BalesinAI
          </h1>

          <nav className="hidden md:flex gap-10 font-medium text-slate-600">
            <button onClick={() => scrollTo("#fitur")} className="hover:text-blue-600 hover:scale-105 transition">
              Fitur
            </button>

            <button onClick={() => scrollTo("#cara")} className="hover:text-blue-600 hover:scale-105 transition">
              Cara Kerja
            </button>

            <button onClick={() => scrollTo("#harga")} className="hover:text-blue-600 hover:scale-105 transition">
              Harga
            </button>
          </nav>

          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 transition text-white text-sm font-semibold shadow-md"
          >
            Login
          </Link>

        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-36 text-center px-8 bg-gradient-to-b from-blue-50 to-transparent scroll-fade opacity-0 translate-y-6 transition-all duration-700">

        <div className="absolute inset-0 pointer-events-none">
          <div className="w-96 h-96 bg-blue-200/40 rounded-full blur-3xl absolute top-10 left-10"></div>
          <div className="w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl absolute bottom-0 right-10"></div>
        </div>

        <div className="relative max-w-4xl mx-auto">

          <h2 className="text-6xl font-extrabold tracking-tight text-slate-900 leading-tight drop-shadow-sm">
            Customer Service WhatsApp Otomatis
            <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 bg-clip-text text-transparent block mt-2">
              untuk bisnis modern
            </span>
          </h2>

          <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-2xl mx-auto">
            Balesin AI membalas chat pelanggan secara otomatis 24/7 menggunakan kecerdasan buatan.
            Hemat biaya CS dan naikan omset bisnis kamu.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
            <Link
              to="/register"
              className="px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 transition text-white text-lg font-bold shadow-xl shadow-blue-600/20"
            >
              Daftar Gratis →
            </Link>

            <button
              onClick={() => scrollTo("#fitur")}
              className="px-10 py-4 rounded-xl border border-slate-300 hover:bg-slate-100 hover:scale-105 transition text-lg font-semibold"
            >
              Pelajari dulu
            </button>
          </div>

        </div>

        <img
          src="/assets/hero.png"
          className="mx-auto w-44 mt-24 opacity-95 hover:scale-110 transition-all duration-300 drop-shadow-xl"
          alt="hero"
        />
      </section>


      {/* FITUR */}
      <section id="fitur" className="bg-[#f9fafb] py-28 px-6 scroll-fade opacity-0 translate-y-6 transition-all duration-700 delay-200">

        <div className="max-w-4xl mx-auto text-center mb-20">
          <h3 className="text-4xl font-extrabold text-slate-900 mb-4">Kenapa pilih Balesin AI?</h3>
          <p className="text-slate-600 text-lg">
            Bot WhatsApp pintar untuk otomatisasi bisnis kamu.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">

          {[ 
            {icon:"🤖", title:"Balas Otomatis", text:"Bot membalas chat pelanggan sesuai profil bisnis."},
            {icon:"⚡", title:"Respons Instan", text:"Jawab pelanggan dalam hitungan detik tanpa admin online."},
            {icon:"📦", title:"Produk & FAQ", text:"AI memahami produk dan FAQ tanpa setting manual."}
          ].map((card, i)=>(
            <div key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl px-10 py-14 text-center 
              hover:-translate-y-2 hover:scale-[1.04] hover:shadow-2xl
              transition-all duration-300"
            >
              <span className="text-5xl drop-shadow">{card.icon}</span>
              <h4 className="font-bold text-2xl mt-6 mb-3">{card.title}</h4>
              <p className="text-slate-500 text-base leading-relaxed">{card.text}</p>
            </div>
          ))}

        </div>
      </section>


      {/* HOW WORKS */}
      <section id="cara"
        className="py-36 px-6 scroll-fade opacity-0 translate-y-6 transition-all duration-700 delay-300"
      >

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          <img
            src="/assets/how.png"
            className="w-[360px] mx-auto hover:scale-105 drop-shadow-lg transition-all duration-300"
            alt="how"
          />

          <div>
            <h3 className="text-4xl font-extrabold text-slate-900 mb-6">Cara Kerja Balesin AI</h3>

            <ul className="text-slate-600 space-y-4 text-lg leading-relaxed">
              <li>✓ Daftar & setup profil bisnis</li>
              <li>✓ Scan QR WhatsApp untuk bot</li>
              <li>✓ Tambahkan produk & FAQ</li>
              <li>✓ AI auto jawab pelanggan 24/7</li>
            </ul>

          </div>
        </div>
      </section>


      {/* PRICE */}
      <section id="harga"
        className="bg-white py-36 px-6 scroll-fade opacity-0 translate-y-6 transition-all duration-700 delay-500">

        <div className="max-w-6xl mx-auto text-center">

          <h3 className="text-4xl font-extrabold mb-12 text-slate-900">Harga Balesin AI</h3>

          <div
            className="max-w-sm mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-3xl p-14 shadow-[0_0_30px_rgba(37,99,235,0.35)]
            hover:scale-105 transition-all duration-300"
          >
            <p className="uppercase tracking-widest text-xs mb-5 opacity-80">
              Bulanan
            </p>

            <h4 className="text-6xl font-extrabold leading-none mb-6 drop-shadow-md">
              Rp 99K
            </h4>

            <p className="opacity-90 mb-10 text-base">
              Full akses AI WhatsApp otomatis tanpa batas chat.
            </p>

            <Link
              to="/register"
              className="bg-white text-blue-700 font-bold hover:bg-slate-100 hover:scale-105 transition px-10 py-3 rounded-2xl shadow text-lg"
            >
              Mulai Sekarang →
            </Link>
          </div>

        </div>
      </section>


      {/* FOOTER */}
      <footer className="text-center py-14 text-slate-500 text-sm border-t border-slate-200">
        © {new Date().getFullYear()} BalesinAI — WhatsApp Automation Platform.
      </footer>

    </div>
  );
}
