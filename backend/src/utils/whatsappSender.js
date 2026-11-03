let sockInstance = null;

// Fungsi untuk menyimpan instance sock saat bot Baileys nyala
function setWhatsAppSock(sock) {
  sockInstance = sock;
  global.whatsappSock = sock; // Backup ke global juga
  console.log("🔌 WhatsApp Bot Socket berhasil diinisialisasi ke Sender!");
}

// Helper normalisasi nomor
function normalizePhone(phone) {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
}

// Fungsi utama untuk kirim pesan
async function sendWhatsAppMessage(phone, message) {
  const sock = sockInstance || global.whatsappSock;

  if (!sock) {
    console.log("❌ Gagal kirim WA: Sock Baileys belum siap.");
    return false;
  }

  if (!phone) {
    console.log("❌ Gagal kirim WA: Nomor telepon kosong.");
    return false;
  }

  try {
    const cleanPhone = normalizePhone(phone);
    const recipientJid = `${cleanPhone}@s.whatsapp.net`;

    await sock.sendMessage(recipientJid, { text: message });
    console.log("✅ Pesan WhatsApp sukses terkirim ke:", cleanPhone);
    return true;
  } catch (err) {
    console.error("❌ Error saat mengirim pesan WhatsApp:", err.message);
    return false;
  }
}

module.exports = {
  setWhatsAppSock,
  sendWhatsAppMessage
};