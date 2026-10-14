const { parseFinanceWithAI } = require("../ai/financeParser");
const FinancialTransaction = require("../models/FinancialTransaction");
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

  // Ambil nama pengguna (fallback ke email jika name belum terisi)
  const userName = user?.name || user?.nama || user?.email || "Kak";

  // URL Tampilan UI Web Dashboard (Default ke localhost:5173)
  const WEB_DASHBOARD_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    // ==========================================
    // 1. FITUR BANTUAN (/HELP / MENU)
    // ==========================================
    if (["/help", "help", "/menu", "menu", "/bantuan", "bantuan"].includes(lowerText)) {
      const helpMessage = 
        `Halo *${userName}*! 👋 Ada yang bisa dibantu untuk keuanganmu hari ini?\n\n` +
        `Kamu bisa langsung ketik catatan transaksimu seperti biasa, misalnya:\n` +
        `• _10rb cilok_ (otomatis masuk pengeluaran)\n` +
        `• _5jt gaji_ (otomatis masuk pemasukan)\n` +
        `• Atau tinggal *kirim foto/struk* belanjaanmu ke sini 📸\n\n` +
        `📌 *Beberapa perintah cepat:* \n` +
        `• *rekap* -> Lihat ringkasan pemasukan & pengeluaran hari ini\n` +
        `• *grafik* -> Kirim grafik performa keuangan 7 hari terakhir\n` +
        `• *list* -> Intip 5 transaksi terakhir\n` +
        `• *hapus [nomor]* -> Hapus transaksi tertentu (misal: *hapus 1*)\n` +
        `• *web* -> Link cepat ke Dashboard Web UI\n\n` +
        `🌐 *Pantau langsung dari Web UI:* \n${WEB_DASHBOARD_URL}`;

      await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 2. FITUR REKAP HARIAN & LINK WEB UI
    // ==========================================
    if (["rekap", "harian", "laporan", "today", "rekap harian"].includes(lowerText)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Ambil transaksi hari ini
      const todayTxs = await FinancialTransaction.find({
        userId: user._id,
        date: { $gte: startOfDay,$lte: endOfDay }
      }).sort({ date: -1 });

      let totalIncome = 0;
      let totalExpense = 0;
      let itemsDetailText = "";

      todayTxs.forEach((tx, idx) => {
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
      const dateFormatted = new Date().toLocaleDateString("id-ID", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const rekapMessage = 
        `📊 *REKAP KEUANGAN HARIAN*\n` +
        `Halo *${userName}*! Ini ringkasan transaksimu untuk *${dateFormatted}*:\n` +
        `-----------------------------------\n` +
        `🟢 Total Pemasukan : Rp ${totalIncome.toLocaleString("id-ID")}\n` +
        `🔴 Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}\n` +
        `-----------------------------------\n` +
        `💰 *Sisa Saldo Hari Ini: Rp ${netBalance.toLocaleString("id-ID")}*\n\n` +
        `📝 *Rincian catatan hari ini (${todayTxs.length}):*\n` +
        (itemsDetailText || "_Belum ada transaksi yang dicatat hari ini._\n") +
        `\n🌐 *Cek tampilan grafik & grafik lengkap di Web UI:*\n${WEB_DASHBOARD_URL}\n\n` +
        `💡 _Ketik *grafik* untuk lihat gambar chart atau */help* kalau butuh bantuan lain._`;

      await sock.sendMessage(jid, { text: rekapMessage }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 3. FITUR KIRIM GRAFIK KEUANGAN (QUICKCHART IMAGE)
    // ==========================================
    if (["grafik", "chart", "diagram"].includes(lowerText)) {
      await sock.sendMessage(jid, { text: `Tunggu sebentar ya *${userName}*, lagi buatkan grafik keuanganmu... ⏳` }, { quoted: msg });

      // Ambil akumulasi 7 hari terakhir
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentTxs = await FinancialTransaction.find({
        userId: user._id,
        date: { $gte: sevenDaysAgo }
      });

      let totalIncome = 0;
      let totalExpense = 0;

      recentTxs.forEach((tx) => {
        if (tx.type === "INCOME") totalIncome += tx.totalAmount;
        else totalExpense += tx.totalAmount;
      });

      // Konstruksi QuickChart Config
      const chartConfig = {
        type: 'bar',
        data: {
          labels: ['Pemasukan', 'Pengeluaran'],
          datasets: [{
            label: 'Total Nominal (Rp)',
            data: [totalIncome, totalExpense],
            backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(239, 68, 68, 0.85)'],
            borderColor: ['#16a34a', '#dc2626'],
            borderWidth: 2
          }]
        },
        options: {
          title: {
            display: true,
            text: `Grafik Keuangan 7 Hari Terakhir - ${userName}`,
            fontSize: 16
          },
          legend: { display: false },
          plugins: {
            datalabels: {
              anchor: 'end',
              align: 'top',
              color: '#1e293b',
              font: { weight: 'bold' }
            }
          }
        }
      };

      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=400&bkg=white`;

      const chartCaption = 
        `📈 *GRAFIK KEUANGAN (7 HARI TERAKHIR)*\n` +
        `Catatan milik: *${userName}*\n\n` +
        `🟢 Total Pemasukan : Rp ${totalIncome.toLocaleString("id-ID")}\n` +
        `🔴 Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}\n\n` +
        `🌐 *Mau lihat rincian lebih detail? Buka Web UI di sini:*\n${WEB_DASHBOARD_URL}`;

      await sock.sendMessage(jid, {
        image: { url: chartUrl },
        caption: chartCaption
      }, { quoted: msg });

      return true;
    }

    // ==========================================
    // 4. FITUR LIHAT LINK WEB UI DENGAN SINGKAT
    // ==========================================
    if (["web", "dashboard", "ui", "link"].includes(lowerText)) {
      const webMsg = 
        `🌐 *DASHBOARD WEB KEUANGAN*\n\n` +
        `Halo *${userName}*! Kamu bisa lihat grafik lengkap, download laporan, dan atur riwayat transaksimu langsung di sini ya:\n\n` +
        `👉 ${WEB_DASHBOARD_URL}`;

      await sock.sendMessage(jid, { text: webMsg }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 5. FITUR LIHAT LIST TRANSAKSI (RIWAYAT)
    // ==========================================
    if (["list", "riwayat", "transaksi", "data"].includes(lowerText)) {
      const txs = await FinancialTransaction.find({ userId: user._id }).sort({ date: -1 }).limit(5);

      if (txs.length === 0) {
        await sock.sendMessage(jid, { 
          text: `📭 *${userName}*, sejauh ini belum ada catatan transaksi yang tersimpan nih.\n\n` +
                `💡 Coba langsung tulis transaksimu (misal: _15rb makan siang_) atau ketik */help* untuk petunjuknya ya!\n` +
                `🌐 Web Dashboard: ${WEB_DASHBOARD_URL}` 
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
      listText += `\n💡 _Kalau ada yang keliru, ketik *hapus [nomor]* buat batalin (contoh: *hapus 1*)_\n` +
                  `💡 _Ketik *rekap* buat cek total hari ini._\n` +
                  `🌐 Web Dashboard: ${WEB_DASHBOARD_URL}`;

      await sock.sendMessage(jid, { text: listText }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 6. FITUR HAPUS BERDASARKAN NOMOR (Cth: "hapus 1")
    // ==========================================
    if (lowerText.startsWith("hapus ") || lowerText.startsWith("del ")) {
      const parts = lowerText.split(" ");
      const indexNum = parseInt(parts[1]);

      if (isNaN(indexNum) || indexNum < 1) {
        await sock.sendMessage(jid, { text: `Ehh formatnya kurang pas nih *${userName}*. Coba ketik *list* dulu buat lihat nomornya, terus ketik *hapus [nomor]* ya (contoh: *hapus 1*).\n\n💡 Ketik */help* kalau bingung.` }, { quoted: msg });
        return true;
      }

      const txs = await FinancialTransaction.find({ userId: user._id }).sort({ date: -1 }).limit(5);

      if (indexNum > txs.length) {
        await sock.sendMessage(jid, { text: `Waduh, transaksi nomor *${indexNum}* gak ketemu nih di 5 catatan terakhirmu *${userName}*.\n\n💡 Ketik *list* dulu yuk buat kroscek!` }, { quoted: msg });
        return true;
      }

      const targetTx = txs[indexNum - 1];
      await FinancialTransaction.findByIdAndDelete(targetTx._id);

      const deletedName = targetTx.items[0]?.name || targetTx.vendor || "Transaksi";
      await sock.sendMessage(jid, { 
        text: `🗑️ Siap *${userName}*, transaksi nomor *${indexNum}* (*${deletedName}* - Rp ${targetTx.totalAmount.toLocaleString("id-ID")}) udah berhasil dihapus ya!\n\n` +
              `💡 _Ketik *rekap* kalau mau lihat total saldomu yang baru._\n` +
              `🌐 Web Dashboard: ${WEB_DASHBOARD_URL}` 
      }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 7. PROSES CATAT TRANSAKSI (TEKS / GAMBAR)
    // ==========================================
    let imageBase64 = null;
    if (hasImage) {
      const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: console });
      imageBase64 = buffer.toString("base64");
    }

    // Jika pesan kosong dan tidak ada gambar, abaikan
    if (!text && !hasImage) return false;

    // Ambil histori nama item untuk acuan AI
    const history = await FinancialTransaction.distinct("items.name", { userId: user._id });
    const aiResult = await parseFinanceWithAI(text, imageBase64, history.slice(0, 20));

    // Jika terdeteksi sebagai data keuangan yang valid oleh AI
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
                   `✅ Mantap, sudah rapi tersimpan!\n\n` +
                   `💡 _Ketik *rekap* untuk cek total harimu._\n` +
                   `🌐 *Lihat di Web Dashboard:*\n${WEB_DASHBOARD_URL}`;

      await sock.sendMessage(jid, { text: nota }, { quoted: msg });
      return true;
    }

    // ==========================================
    // 8. FALLBACK / CHAT LAIN DILUAR TRANSAKSI SAH
    // ==========================================
    const fallbackMsg = 
      `Halo *${userName}*! 👋\n` +
      `Aku kurang paham nih sama maksud catatannya. Mau nyatet transaksi atau cek laporan keuangan?\n\n` +
      `💡 _Coba langsung tulis nominalnya (contoh: *15rb makan siang*) atau ketik */help* buat petunjuk lengkapnya ya!_\n\n` +
      `🌐 *Web Dashboard UI:*\n${WEB_DASHBOARD_URL}`;

    await sock.sendMessage(jid, { text: fallbackMsg }, { quoted: msg });
    return true;

  } catch (err) {
    console.error("Finance Handler Error:", err.message);
  }

  return false;
};