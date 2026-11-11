const { parseFinanceWithAI } = require("../ai/financeParser");
const FinancialTransaction = require("../models/FinancialTransaction");
const User = require("../models/User");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = async function financeHandler(sock, user, m) {
  const msg = m.messages?.[0];
  if (!msg) return false;

  const jid = msg.key.remoteJidAlt || msg.key.remoteJid;
  const text = (
    msg.message?.conversation || 
    msg.message?.extendedTextMessage?.text || 
    msg.message?.imageMessage?.caption || 
    ""
  ).trim();
  const hasImage = !!msg.message?.imageMessage;
  const lowerText = text.toLowerCase();

  // ==========================================
  // CEK SUBSCRIPTION / MASA BERLAKU BERLANGGANAN
  // ==========================================
  const now = new Date();
  const isSubscribed = user?.subscribedUntil && new Date(user.subscribedUntil) > now;
  
  if (!isSubscribed) {
    const unsubscribedMsg = `Halo! 👋 Masa berlangganan kamu belum aktif atau sudah berakhir.\n\nSilahkan daftar ke https://balesin-ai.netlify.app`;
    await sock.sendMessage(jid, { text: unsubscribedMsg }, { quoted: msg });
    return true;
  }

  // Ambil nama pengguna
  const userName = user?.name || user?.nama || user?.email || "Kak";

  // Pastikan user punya shareToken unik untuk RekapPage
  let dbUser = await User.findById(user._id);
  if (dbUser && !dbUser.shareToken) {
    dbUser.shareToken = crypto.randomBytes(8).toString("hex");
    await dbUser.save();
  }

  const userShareToken = dbUser?.shareToken || "";
  const BASE_URL = process.env.FRONTEND_URL || "https://balesin-ai.netlify.app";
  const PUBLIC_REKAP_URL = `${BASE_URL}/rekap/${userShareToken}`;

  try {
    // ==========================================
    // 1. FITUR BANTUAN (/HELP / MENU)
    // ==========================================
    if (["/help", "help", "/menu", "menu", "/bantuan", "bantuan"].includes(lowerText)) {
      const helpMessage = 
        `Halo *${userName}*! 👋 Ada yang bisa dibantu buat catat keuanganmu hari ini?\n\n` +
        `Ketik langsung transaksimu santai aja, contoh:\n` +
        `• _15rb es teh_ (Otomatis Pengeluaran)\n` +
        `• _2jt gaji bulanan_ (Otomatis Pemasukan)\n` +
        `• Atau *kirim foto/struk* belanjaan 📸\n\n` +
        `🗓️ *Pilih Rekap Berdasarkan Waktu (Dinamis):*\n` +
        `• Ketik *rekap* -> Hari ini\n` +
        `• Ketik *rekap kemarin* -> Hari kemarin\n` +
        `• Ketik *rekap minggu ini* -> Minggu ini\n` +
        `• Ketik *rekap bulan ini* -> Bulan ini\n` +
        `• Ketik *rekap 14/10/2026* -> Tanggal tertentu\n\n` +
        `📋 *Perintah Lainnya:*\n` +
        `• *list* -> Lihat 5 transaksi terakhir\n` +
        `• *hapus [nomor]* -> Hapus transaksi (Cth: *hapus 1*)\n\n` +
        `🌐 *Link Web RekapPage Unikmu:*\n${PUBLIC_REKAP_URL}`;

      await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 2. FITUR REKAP DINAMIS (TANGGAL / PERIODE CUSTOM)
    // ==========================================
    if (lowerText.startsWith("rekap") || lowerText.startsWith("/rekap") || lowerText.startsWith("laporan")) {
      let startDate = new Date();
      let endDate = new Date();
      let titleLabel = "HARI INI";

      const param = lowerText.replace(/^(\/rekap|rekap|laporan)\s*/i, "").trim();

      if (param === "kemarin") {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        titleLabel = "KEMARIN";
      } else if (param === "minggu ini" || param === "mingguan") {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        titleLabel = "MINGGU INI";
      } else if (param === "bulan ini" || param === "bulanan") {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        titleLabel = "BULAN INI";
      } else if (param.length > 0) {
        const parsedDate = new Date(param);
        if (!isNaN(parsedDate.getTime())) {
          startDate = new Date(parsedDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(parsedDate);
          endDate.setHours(23, 59, 59, 999);
          titleLabel = parsedDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
        } else {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const txs = await FinancialTransaction.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      let totalIncome = 0;
      let totalExpense = 0;
      let itemsDetailText = "";

      txs.forEach((tx, idx) => {
        if (tx.type === "INCOME") {
          totalIncome += tx.totalAmount;
        } else {
          totalExpense += tx.totalAmount;
        }

        const itemName = tx.items[0]?.name || tx.vendor || "Transaksi";
        const icon = tx.type === "INCOME" ? "🟢" : "🔴";
        itemsDetailText += `${idx + 1}. ${icon} ${itemName} - Rp ${tx.totalAmount.toLocaleString("id-ID")}\n`;
      });

      const netBalance = totalIncome - totalExpense;

      const rekapMessage = 
        `📊 *REKAP KEUANGAN: ${titleLabel}*\n` +
        `Halo *${userName}*! Ini ringkasan transaksimu:\n` +
        `-----------------------------------\n` +
        `🟢 Total Pemasukan : Rp ${totalIncome.toLocaleString("id-ID")}\n` +
        `🔴 Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}\n` +
        `-----------------------------------\n` +
        `💰 *Saldo Bersih: Rp ${netBalance.toLocaleString("id-ID")}*\n\n` +
        `📝 *Rincian (${txs.length} Transaksi):*\n` +
        (itemsDetailText || "_Belum ada transaksi di periode ini._\n") +
        `\n🌐 *Buka RekapPage Web (Grafik & Tabel Lengkap):*\n${PUBLIC_REKAP_URL}\n\n` +
        `📌 *Coba filter lain:* Ketik *rekap kemarin*, *rekap minggu ini*, atau *rekap bulan ini*.`;

      await sock.sendMessage(jid, { text: rekapMessage }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 3. FITUR GRAFIK & WEB
    // ==========================================
    if (["grafik", "/grafik", "chart", "/chart", "web", "/web", "link", "/link"].includes(lowerText)) {
      const webMsg = 
        `🌐 *WEB DASHBOARD & GRAFIK KEUANGAN*\n\n` +
        `Halo *${userName}*! Silakan buka link web RekapPage milikmu untuk melihat grafik interaktif dan ringkasan lengkapnya di sini:\n\n` +
        `👉 ${PUBLIC_REKAP_URL}`;

      await sock.sendMessage(jid, { text: webMsg }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 4. FITUR LIHAT LIST TRANSAKSI (RIWAYAT)
    // ==========================================
    if (["list", "/list", "riwayat", "/riwayat", "transaksi", "/transaksi"].includes(lowerText)) {
      const txs = await FinancialTransaction.find({ userId: user._id }).sort({ date: -1 }).limit(5);

      if (txs.length === 0) {
        await sock.sendMessage(jid, { 
          text: `📭 *${userName}*, belum ada catatan transaksi yang tersimpan nih.\n\n` +
                `💡 Coba langsung tulis transaksimu (misal: _15rb makan siang_)\n` +
                `🌐 Web Rekap: ${PUBLIC_REKAP_URL}` 
        }, { quoted: msg });
        return true;
      }

      let listText = `📋 *5 TRANSAKSI TERAKHIRMU (${userName}):*\n\n`;
      txs.forEach((tx, index) => {
        const sign = tx.type === "INCOME" ? "🟢 +" : "🔴 -";
        const dateStr = new Date(tx.date).toLocaleDateString("id-ID");
        const itemName = tx.items[0]?.name || tx.vendor || "Transaksi";
        listText += `*${index + 1}.* ${dateStr} | *${itemName}* (${sign}Rp ${tx.totalAmount.toLocaleString("id-ID")})\n`;
      });
      listText += `\n💡 _Ketik *hapus [nomor]* kalau mau batalkan (contoh: *hapus 1*)_\n` +
                  `🌐 Web Rekap: ${PUBLIC_REKAP_URL}`;

      await sock.sendMessage(jid, { text: listText }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 5. FITUR HAPUS BERDASARKAN NOMOR
    // ==========================================
    if (lowerText.startsWith("hapus ") || lowerText.startsWith("/hapus ") || lowerText.startsWith("del ") || lowerText.startsWith("/del ")) {
      const parts = lowerText.split(" ");
      const indexNum = parseInt(parts[1]);

      if (isNaN(indexNum) || indexNum < 1) {
        await sock.sendMessage(jid, { text: `Format salah *${userName}*. Ketik *list* dulu buat lihat nomornya, terus ketik *hapus [nomor]* ya (contoh: *hapus 1*).` }, { quoted: msg });
        return true;
      }

      const txs = await FinancialTransaction.find({ userId: user._id }).sort({ date: -1 }).limit(5);

      if (indexNum > txs.length) {
        await sock.sendMessage(jid, { text: `Waduh, transaksi nomor *${indexNum}* gak ketemu nih di 5 catatan terakhirmu *${userName}*.` }, { quoted: msg });
        return true;
      }

      const targetTx = txs[indexNum - 1];
      await FinancialTransaction.findByIdAndDelete(targetTx._id);

      const deletedName = targetTx.items[0]?.name || targetTx.vendor || "Transaksi";
      await sock.sendMessage(jid, { 
        text: `🗑️ Siap *${userName}*, transaksi nomor *${indexNum}* (${deletedName} - Rp ${targetTx.totalAmount.toLocaleString("id-ID")}) berhasil dihapus!\n\n` +
              `🌐 Web Rekap: ${PUBLIC_REKAP_URL}` 
      }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 6. PROSES CATAT TRANSAKSI (TEKS / GAMBAR VIA AI)
    // ==========================================
    let imageBase64 = null;
    if (hasImage) {
      const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: console });
      imageBase64 = buffer.toString("base64");
    }

    if (!text && !hasImage) return false;

    const history = await FinancialTransaction.distinct("items.name", { userId: user._id });
    const aiResult = await parseFinanceWithAI(text, imageBase64, history.slice(0, 20));

    if (aiResult?.isFinancialData && aiResult.total > 0) {
      const txType = aiResult.type === "EXPENSE" ? "EXPENSE" : "INCOME";

      const tx = new FinancialTransaction({
        userId: user._id,
        date: aiResult.date || new Date(),
        type: txType,
        vendor: aiResult.vendor || (txType === "INCOME" ? "Pelanggan Toko" : "Pengeluaran Umum"),
        items: aiResult.items || [{ name: aiResult.insight || "Transaksi", qty: 1, price: aiResult.total, subtotal: aiResult.total }],
        totalAmount: aiResult.total,
        source: hasImage ? "image" : "chat",
        rawText: text
      });
      await tx.save();

      const typeLabel = txType === "INCOME" ? "🟢 PEMASUKAN" : "🔴 PENGELUARAN";
      const itemsList = aiResult.items?.map(i => `- ${i.name} (x${i.qty || 1})`).join("\n") || `- ${aiResult.insight || "Transaksi"}`;

      const nota = `📝 *CATATAN KEUANGAN BARU*\n` +
                   `Pemilik: *${userName}*\n` +
                   `Jenis: ${typeLabel}\n` +
                   `📅 ${aiResult.date}\n` +
                   `🏷️ ${aiResult.vendor}\n` +
                   `--------------------------\n` +
                   `${itemsList}\n` +
                   `--------------------------\n` +
                   `💰 *Total: Rp ${aiResult.total.toLocaleString("id-ID")}*\n` +
                   `✅ Berhasil dicatat ke database!\n\n` +
                   `🌐 *Cek Rekap Web Lengkap:*\n${PUBLIC_REKAP_URL}`;

      await sock.sendMessage(jid, { text: nota }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 7. FALLBACK
    // ==========================================
    const fallbackMsg = 
      `Halo *${userName}*! 👋\n` +
      `Aku kurang paham sama maksud catatannya. Mau nyatet transaksi atau cek laporan keuangan?\n\n` +
      `💡 _Coba langsung tulis nominalnya (contoh: *15rb makan siang*) atau ketik */help* buat bantuan lengkapnya ya!_\n\n` +
      `🌐 *Link Web Rekap:* ${PUBLIC_REKAP_URL}`;

    await sock.sendMessage(jid, { text: fallbackMsg }, { quoted: msg });
    return true;

  } catch (err) {
    console.error("Finance Handler Error:", err.message);
  }

  return false;
};