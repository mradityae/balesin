const MCP = require("../mcp");
const Business = require("../models/BusinessProfile");

module.exports = async function handleMessage(sock, user, m) {
  const msg = m.messages?.[0];
  if (!msg || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text;

  if (!text) return;

  const business = await Business.findOne({ userId: user._id });

  if (!business) {
    await sock.sendMessage(jid, {
      text:
        "Bot belum aktif karena profil bisnis belum dikonfigurasi.\n" +
        "Silakan login ke dashboard untuk setup bisnis.",
    });
    return;
  }

  try {

    // <<< ━━━━━━━ ADD HERE ━━━━━━━
    await sock.sendPresenceUpdate("composing", jid);

    const reply = await MCP(user._id, text);

    await sock.sendPresenceUpdate("paused", jid);
    // <<< ━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(jid, { text: reply });

  } catch (e) {
    console.error("AI error:", e.message);
    await sock.sendPresenceUpdate("paused", jid);
    await sock.sendMessage(jid, {
      text: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
    });
  }
};
