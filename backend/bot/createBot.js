const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const { getSessionPath } = require("./sessionManager");
const Bot = require("../models/Bot");
const handleMessage = require("./messageHandler");
const { setWhatsAppSock } = require("../src/utils/whatsappSender");

module.exports = async function createBot(user) {

  const sessionPath = getSessionPath(user._id);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  // Fetch the actual current WhatsApp web version dynamically
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    version, // Use dynamic version instead of hardcoded
    browser: ["Chrome", "Desktop", "110.0.5481.177"] // Stable browser profile string
  });

  let isDead = false;

  sock.ev.on("connection.update", async (update) => {
    if (isDead) return;
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      const dataUrl = await qrcode.toDataURL(qr);
      await Bot.findOneAndUpdate(
        { uid: user._id },
        { qr: dataUrl, connected: false },
        { upsert: true }
      );
      console.log("📱 QR Code generated for user:", user._id);
    }

    if (connection === "open") {
      await Bot.findOneAndUpdate(
        { uid: user._id },
        {
          connected: true,
          qr: null,
          phone: sock.user?.id
        },
        { upsert: true }
      );
      console.log("✅ WA connected:", user._id);
      setWhatsAppSock(sock);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log("Logged out:", user._id);
        isDead = true;
        return;
      }

      console.log("🔁 Connection dropped. Reconnecting in 5 seconds...");

      try {
        await sock.ws.close(); 
      } catch {}

      isDead = true;

      // Longer delay to prevent WhatsApp rate-limiting your IP/socket spam
      setTimeout(() => {
        createBot(user);        
      }, 5000);
    }
  });

  sock.ev.on("creds.update", async () => {
    try {
      await saveCreds();
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    if (isDead) return;
    try {
      await handleMessage(sock, user, m);
    } catch (err) {
      if (err?.name === "SessionError") return;
      console.log("Message error:", err.message);
    }
  });

  sock.killInstance = async () => {
    try { await sock.ws.close(); } catch {}
    try { sock.ev.removeAllListeners(); } catch {}
    isDead = true;
  };

  return sock;
};