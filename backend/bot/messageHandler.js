const MCP = require("../mcp");
const Business = require("../models/BusinessProfile");

// Random helper
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

    /* ━━━━━━━━━━━━━━━━━━━━━━━━
       TYPING BEFORE MCP
    ━━━━━━━━━━━━━━━━━━━━━━━━ */

    let typing = true;

    // start composing
    await sock.sendPresenceUpdate("composing", jid);

    // random typing loop
    const typingLoop = async () => {
      while (typing) {
        await sock.sendPresenceUpdate("composing", jid);
        await new Promise(r => setTimeout(r, randomDelay(800, 2500)));
      }
    };

    typingLoop(); // run without await



    /* ━━━━━━━━━━━━━━━━━━━━━━━━
       AI RESPONSE
    ━━━━━━━━━━━━━━━━━━━━━━━━ */

    const reply = await MCP(user._id, text); // MCP bisa lama → typing tetap jalan



    /* ━━━━━━━━━━━━━━━━━━━━━━━━
       STOP TYPING
    ━━━━━━━━━━━━━━━━━━━━━━━━ */

    typing = false;
    await sock.sendPresenceUpdate("paused", jid);



    /* ━━━━━━━━━━━━━━━━━━━━━━━━
       SEND MESSAGE
    ━━━━━━━━━━━━━━━━━━━━━━━━ */

    await sock.sendMessage(jid, { text: reply });

  } catch (e) {

    typing = false;
    await sock.sendPresenceUpdate("paused", jid);

    console.log("AI error:", e.message);
    await sock.sendMessage(jid, {
      text: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
    });
  }
};
