const { generateGemini } = require("./gemini");

/**
 * Mendeteksi apakah user ingin melihat laporan/rekap secara fleksibel (tidak kaku)
 */
function isQueryIntent(text = "") {
  if (!text) return false;
  const q = text.toLowerCase().trim();

  // Pola kata kunci atau frasa yang sering digunakan untuk minta laporan
  const intentPatterns = [
    "rekap", "laporan", "lapor", "omzet", "penjualan", "keuntungan", 
    "pemasukan", "pengeluaran", "keluar masuk", "duit", "saldo", "total",
    "hari ini", "kemarin", "minggu ini", "bulan ini", "minggu lalu", "bulan lalu",
    "catatan", "transaksi", "penghasilan", "untung", "rugi"
  ];

  // AI/Pengecekan fleksibel: apakah mengandung salah satu keyword atau frasa tanya laporan
  return intentPatterns.some(keyword => q.includes(keyword)) || 
         q.startsWith("cek") || 
         q.startsWith("lihat") || 
         q.startsWith("total");
}

/**
 * Mengolah data transaksi menjadi bahasa laporan yang luwes dan ramah ala asisten toko
 */
async function summarizeFinance({ text, transactions }) {
  // Hitung statistik dasar untuk dibaca AI
  const totalOmzet = transactions.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalTransaksi = transactions.length;

  const prompt = `Kamu adalah asisten toko/kasir digital yang ramah, santai, cekatan, dan sangat natural seperti manusia (gaya chat WhatsApp bisnis yang akrab tapi sopan). 

Tugasmu merangkum data transaksi toko untuk pemilik toko.

Pesan/Pertanyaan Pemilik Toko: "${text}"

Data Transaksi dari Database:
${transactions.length > 0 ? transactions.map(t => `- ${t.date} | ${t.vendor || 'Umum'} | Rp ${(t.totalAmount || 0).toLocaleString("id-ID")}`).join("\n") : "Tidak ada transaksi dalam data ini."}

Statistik Singkat:
- Total Omzet/Nominal: Rp ${totalOmzet.toLocaleString("id-ID")}
- Jumlah Transaksi: ${totalTransaksi} catatan

PANDUAN MENJAWAB:
1. Jawablah dengan luwes, ramah, dan solutif. Jangan kaku atau seperti template robot.
2. Gunakan HANYA data transaksi di atas (jangan mengarang angka di luar data).
3. Jika ditanya soal keuntungan, sampaikan secara jujur bahwa angka tersebut adalah total perputaran/omzet yang tercatat dari data di atas.
4. Berikan sedikit sentuhan personal/insight ringan jika relevan (misal menyebutkan transaksi terbesar atau rangkuman singkat).
5. Format teks agar rapi menggunakan Markdown WhatsApp (seperti *bold* untuk angka penting, dan bullet points) agar enak dibaca di HP.`;

  return generateGemini(prompt);
}

module.exports = {
  isQueryIntent,
  summarizeFinance
};