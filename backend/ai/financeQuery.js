const { generateGemini } = require("./gemini");

/**
 * Mendeteksi apakah user ingin melihat laporan/rekap
 */
function isQueryIntent(text = "") {
  const q = text.toLowerCase();

  // Keyword yang sudah difilter sesuai permintaan
  const keywords = [
    "rekap",
    "laporan",
    "keuntungan",
    "pemasukan",
    "hari ini",
    "kemarin",
    "minggu ini",
    "bulan ini",
    "total"
  ];

  return keywords.some(k => q.includes(k));
}

/**
 * Mengolah data transaksi menjadi bahasa laporan yang enak dibaca
 */
async function summarizeFinance({ text, transactions }) {
  // Hitung total nominal dari data yang ada di database untuk membantu AI
  const totalOmzet = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTransaksi = transactions.length;

  const prompt = `
Kamu adalah asisten kasir toko yang handal. 
Tugasmu adalah menjawab pertanyaan pemilik toko mengenai laporan penjualan berdasarkan data transaksi yang tersedia.

Pertanyaan User: "${text}"

Data Transaksi Terakhir (Database):
${transactions.map(t => `- ${t.date} | ${t.vendor} | Rp ${t.totalAmount.toLocaleString("id-ID")}`).join("\n")}

Ringkasan Statis:
- Total Omzet: Rp ${totalOmzet.toLocaleString("id-ID")}
- Jumlah Transaksi: ${totalTransaksi} nota

Instruksi:
1. Jawab pertanyaan user dengan ramah dan profesional.
2. Gunakan data di atas (JANGAN MENGADA-ADA ANGKA DI LUAR DATA).
3. Jika ditanya soal "Keuntungan", jelaskan bahwa ini adalah total pemasukan/omzet kotor.
4. Berikan rincian singkat jika perlu (misal: "Penjualan terbesar hari ini adalah...").
5. Gunakan format yang rapi (bold/list) agar mudah dibaca di WhatsApp.
`;

  return generateGemini(prompt);
}

module.exports = {
  isQueryIntent,
  summarizeFinance
};