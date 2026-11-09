const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

const parseFinanceWithAI = async (text, imageBase64 = null, historyContext = []) => {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `Kamu adalah asisten keuangan pribadi yang sangat cerdas, santai, dan paham bahasa gaul/sehari-hari Indonesia (termasuk singkatan, typo ringan, dan bahasa tidak formal). Tugasmu mengekstrak transaksi keuangan dari chat atau foto struk.

PANDUAN PEMAHAMAN KONTEKS:
1. TIPE TRANSAKSI (type):
   - "INCOME": Pemasukan, gaji, ketiban rezeki, hasil jualan, omzet, ditransfer orang, nemu duit, dll.
   - "EXPENSE": Pengeluaran, beli barang, bayar-bayar, ngopi, makan, jajan, bensin, ongkos, sewa, dll.
2. NOMINAL FLEKSIBEL: Pahami berbagai format angka seperti "10rb", "10 k", "50 cicil", "5jt", "setengah juta" (500000), "ceban" (10000), "gocap" (50000), titik/koma desimal khas Indonesia.
3. JIKA INPUT TIDAK JELAS/BUKAN TRANSAKSI (misal: "halo", "lagi apa?", "terima kasih"): Set "isFinancialData": false dan berikan respons sapaan/bantuan yang ramah di "insight".
4. JIKA DARI GAMBAR/STRUK: Ekstrak total, nama toko/vendor, dan rincian item dengan teliti meskipun layout struk berantakan.

OUTPUT WAJIB JSON VALID (tanpa teks di luar JSON):
{
  "isFinancialData": true,
  "date": "${today}",
  "type": "INCOME" | "EXPENSE",
  "vendor": "Nama toko/tempat/kategori umum jika tidak ada nama toko",
  "items": [{"name": "string", "qty": 1, "price": 0, "subtotal": 0}],
  "total": 0,
  "insight": "catatan ringkas atau sapaan jika bukan transaksi"
}`;

  try {
    const userContent = [];
    if (text) userContent.push({ type: "text", text: `Input user: ${text}` });
    
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, "")}`,
          detail: "low"
        }
      });
    }

    if (userContent.length === 0) return { isFinancialData: false };

    // Sanitasi historyContext: Pastikan setiap elemen valid berupa objek { role, content }
    const sanitizedHistory = Array.isArray(historyContext) 
      ? historyContext
          .filter(h => h && typeof h === 'object' && h.role && h.content)
          .map(h => ({ role: h.role, content: h.content }))
      : [];

    // Menyusun array messages dengan aman
    const messages = [
      { role: "system", content: systemPrompt },
      ...sanitizedHistory, // Memasukkan riwayat chat yang sudah dibersihkan
      { role: "user", content: userContent }
    ];

    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: messages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenRouter Failed");

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("AI Parser Error:", error.message);
    return { isFinancialData: false };
  }
};

module.exports = { parseFinanceWithAI };