const MCP = require("../mcp");
const Business = require("../models/BusinessProfile");

// helper
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// store typing state per user chat
const typingState = new Map();

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


  /* =====================================================
      TYPING SYSTEM: MAX 20 SECONDS AND SAFE ABORT
  ===================================================== */
  
  // if bot already typing → skip typing animation for this message
  if (!typingState.get(jid)) {

    typingState.set(jid, true);

    (async () => {

      // max 12 loops × 2500ms ≈ 30s total max
      for (let i = 0; i < 12; i++) {

        // already stopped by reply
        if (!typingState.get(jid)) break;

        try {
          await sock.sendPresenceUpdate("composing", jid);
        } catch {}

        await delay(random(800, 2500));
      }

      // safety stop
      await sock.sendPresenceUpdate("paused", jid);

    })();
  }


  /* =====================================================
       AI RESPONSE
  ===================================================== */

  let reply;
  try {
    reply = await MCP(user._id, text);

  } catch (err) {
    await delay(random(1500, 4000));
    typingState.set(jid, false);
    await sock.sendPresenceUpdate("paused", jid);

    console.log("AI error:", err.message);

    await sock.sendMessage(jid, {
      text: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
    });

    return;
  }

  
  /* =====================================================
      SEND MESSAGE TO USER
  ===================================================== */

  await delay(random(1500, 4000));
  typingState.set(jid, false);

  await sock.sendPresenceUpdate("paused", jid);

  try {
    await sock.sendMessage(jid, { text: reply });
  } catch (err) {
    console.log("send error:", err.message);
  }

};
