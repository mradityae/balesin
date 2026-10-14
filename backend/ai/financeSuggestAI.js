const { generateGemini } = require("./gemini");

async function generateFinanceSuggestion({ text, recentTx }) {
  const prompt = `
Kamu adalah asisten keuangan UMKM.

User mengetik:
"${text}"

Kondisi:
- Ini BUKAN transaksi
- Jangan mencatat data apa pun
- Tugasmu hanya memberi saran apa yang bisa dilakukan user

Data transaksi terakhir:
${recentTx.length === 0 ? "Belum ada transaksi" : recentTx
  .map(t => `- ${t.date} | ${t.type} | Rp ${t.totalAmount}`)
  .join("\n")}

Berikan:
1. 3–5 rekomendasi perintah keuangan singkat
2. Contoh input transaksi sederhana
3. Bahasa santai & singkat

JANGAN menanyakan pertanyaan balik.
JANGAN menyimpan data.
`;

  return generateGemini(prompt);
}

module.exports = { generateFinanceSuggestion };
