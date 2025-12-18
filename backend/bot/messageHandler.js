const MCP = require("../mcp");
const Business = require("../models/BusinessProfile");

module.exports = async function handleMessage(sock, user, m, tools = null) {

  if (!tools) return;

  const msg = m?.messages?.[0];
  if (!msg || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  if (!jid.includes("@s.whatsapp.net")) return;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    null;

  if (!text) return;

  const business = await Business.findOne({ userId: user._id });

  if (!business) {
    await tools.humanSend(
      jid,
      "🔒 Bot belum aktif karena profil bisnis belum dikonfigurasi.\nSilakan login ke dashboard untuk setup bisnis."
    );
    return;
  }

  try {

    const reply = await MCP(user._id, text);

    if (reply) {
      await tools.humanSend(jid, reply);
    }

  } catch (e) {

    console.log("HANDLE MESSAGE ERROR:", e);

    await tools.humanSend(
      jid,
      "😔 Maaf, terjadi kesalahan server. Silakan coba lagi nanti."
    );
  }
};
