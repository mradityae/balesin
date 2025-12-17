const Business = require("../models/BusinessProfile");

async function buildContext(userId) {
  const business = await Business.findOne({ userId });
  if (!business) return null;

  return `
PROFIL BISNIS
Nama: ${business.name}
Deskripsi: ${business.description}
Gaya bicara: ${business.tone}

DAFTAR PRODUK:
${(business.products || [])
  .map(
    (p, i) =>
      `${i + 1}. ${p.name}
   Deskripsi: ${p.description}
   Harga: ${p.price || "Hubungi kami"}`
  )
  .join("\n")}

FAQ BISNIS:
${(business.faq || [])
  .map(
    (f, i) =>
      `${i + 1}. Q: ${f.question}
   A: ${f.answer}`
  )
  .join("\n")}

KONTAK ADMIN (HANYA JIKA DIBUTUHKAN):
${business.adminContact || "Tidak tersedia"}
`.trim();
}

module.exports = { buildContext };
