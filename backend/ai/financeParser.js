const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

const parseFinanceWithAI = async (text, imageBase64 = null, historyContext = []) => {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `Anda adalah parser keuangan pintar untuk catat transaksi harian dari CHAT atau STRUK FOTO.

ATURAN PARSING:
1. TIPE TRANSAKSI (type):
   - "INCOME": Jika ada konteks pemasukan, gaji, hasil jual, omzet, dapat duit, atau dari foto struk penjualan.
   - "EXPENSE": Jika ada konteks pengeluaran, beli, bayar, cilok, bensin, makan, sewa, atau foto struk belanja/pembelian.
2. KONVERSI NOMINAL:
   - "10 rb" / "10 ribu" / "10k" -> 10000
   - "5 jt" / "5 juta" -> 5000000
   - "5000.000" / "5.000.000" -> 5000000
3. JIKA DARI GAMBAR/STRUK:
   - Ekstrak total bayar, nama vendor/toko, dan item jika terlihat jelas.
4. JIKA BUKAN TRANSAKSI: Set "isFinancialData": false.

OUTPUT HARUS JSON VALID:
{
  "isFinancialData": true,
  "date": "${today}",
  "type": "INCOME" | "EXPENSE",
  "vendor": "Nama vendor/toko/kategori",
  "items": [{"name": "string", "qty": 1, "price": 0, "subtotal": 0}],
  "total": 0,
  "insight": "catatan ringkas"
}`;

  try {
    const userContent = [];
    if (text) userContent.push({ type: "text", text: `Input: ${text}` });
    
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, "")}`,
          detail: "high"
        }
      });
    }

    if (userContent.length === 0) return { isFinancialData: false };

    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0,
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