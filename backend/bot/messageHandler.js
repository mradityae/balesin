const Pay = require("../models/PaymentProof");
const User = require("../models/User");
const financeHandler = require("./financeHandler");
const { ObjectId } = require("mongodb");

/* =====================================================
   🔥 HELPER: AMBIL NOMOR WA (SUPPORT LID MODE)
===================================================== */
function getSenderPhone(msg) {
  const key = msg.key;

  // ✅ Baileys LID mode (WA terbaru)
  if (key.remoteJidAlt && key.remoteJidAlt.endsWith("@s.whatsapp.net")) {
    return key.remoteJidAlt.split("@")[0];
  }

  // ✅ Grup
  if (key.remoteJid.endsWith("@g.us")) {
    return key.participant?.split("@")[0];
  }

  // ✅ Personal legacy
  if (key.remoteJid.endsWith("@s.whatsapp.net")) {
    return key.remoteJid.split("@")[0];
  }

  return null;
}

/* =====================================================
   🔥 HELPER: NORMALISASI NOMOR (08xxx -> 628xxx)
===================================================== */
function normalizePhone(phone) {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, ""); // Hanya ambil angka
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
}

module.exports = async function handleMessage(sock, hostUser, m) {
  const msg = m.messages?.[0];
  if (!msg || msg.key.fromMe) return;

  const jid = msg.key.remoteJidAlt || msg.key.remoteJid;
  const rawSenderPhone = getSenderPhone(msg);

  if (!rawSenderPhone) {
    console.log("❌ senderPhone not found");
    return;
  }

  // Normalisasi nomor pengirim yang sedang chat ke bot
  const senderPhone = normalizePhone(rawSenderPhone);

  /* =====================================================
     1️⃣ CARI USER DI DATABASE YANG NOMOR HP-NYA COCOK DENGAN PENGIRIM CHAT
  ===================================================== */
  const activeUsers = await User.find({ isActive: true });

  let matchedUser = null;
  for (const u of activeUsers) {
    if (u.phone) {
      const dbUserPhone = normalizePhone(u.phone);
      if (senderPhone === dbUserPhone) {
        matchedUser = u;
        break;
      }
    }
  }

  // Jika nomor pengirim chat TIDAK ADA di database (bukan whitelist), balas dan arahkan daftar
  if (!matchedUser) {
    console.log(`⛔ Sender phone (${senderPhone}) is not whitelisted in users table.`);
    const unsubscribedMsg = `Halo! 👋 Nomor WhatsApp kamu belum terdaftar di BalesinAI.\n\nSilahkan daftar ke https://balesin-ai.netlify.app`;
    await sock.sendMessage(jid, { text: unsubscribedMsg }, { quoted: msg });
    return; 
  }

  /* =====================================================
     2️⃣ CEK APAKAH USER TERSEBUT SUDAH SUBSCRIBE (APPROVED) ATAU ADMIN
  ===================================================== */
  const pay = await Pay.findOne({
    userId: new ObjectId(matchedUser._id),
    status: "approved",
  });

  // Jika user ini belum bayar dan bukan admin, balas dan arahkan daftar/berlangganan
  if (!pay && matchedUser.role !== 'admin') {
    console.log(`⛔ User ${matchedUser.email} has no active subscription.`);
    const unsubscribedMsg = `Halo *${matchedUser.name || "Kak"}*! 👋 Masa berlangganan kamu belum aktif atau belum membayar.\n\nSilahkan daftar ke https://balesin-ai.netlify.app`;
    await sock.sendMessage(jid, { text: unsubscribedMsg }, { quoted: msg });
    return; 
  }

  // Jalankan handler Keuangan AI menggunakan data `matchedUser` (pengirim chat yang nomornya sudah terdaftar di DB)
  await financeHandler(sock, matchedUser, m);
};