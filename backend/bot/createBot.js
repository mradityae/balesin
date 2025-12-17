const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const { getSessionPath } = require("./sessionManager");
const Bot = require("../models/Bot");
const handleMessage = require("./messageHandler");

module.exports = async function createBot(user) {
  const sessionPath = getSessionPath(user._id);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false
  });

  let reconnecting = false; // ⛔ anti loop

  /* =====================
     CONNECTION UPDATE
     ===================== */
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    // QR
    if (qr) {
      const dataUrl = await qrcode.toDataURL(qr);
      await Bot.findOneAndUpdate(
        { uid: user._id },
        { qr: dataUrl, connected: false },
        { upsert: true }
      );
    }

    // CONNECTED
    if (connection === "open") {
      reconnecting = false;

      await Bot.findOneAndUpdate(
        { uid: user._id },
        {
          connected: true,
          qr: null,
          phone: sock.user?.id
        }
      );

      console.log("✅ WA connected:", user._id);
    }

    // DISCONNECTED
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;

      // LOGOUT → stop total (butuh QR ulang)
      if (code === DisconnectReason.loggedOut) {
        await Bot.findOneAndUpdate(
          { uid: user._id },
          { connected: false, qr: null }
        );
        console.log("🧼 Logged out, need QR");
        return;
      }

      // 🔁 auto reconnect 1x (AMAN untuk pairing)
      if (!reconnecting) {
        reconnecting = true;
        console.log("🔄 Reconnecting once...");
        setTimeout(() => createBot(user), 1500);
      }
    }
  });

  /* =====================
     SAVE CREDS (SAFE)
     ===================== */
  sock.ev.on("creds.update", async () => {
  try {
    await saveCreds();
  } catch (e) {
    if (e.code === "ENOENT") {
      console.warn("⚠️ creds.json missing, save skipped");
      return;
    }
    throw e;
  }
});

  /* =====================
     MESSAGE HANDLER
     ===================== */
  sock.ev.on("messages.upsert", async (m) => {
    try {
      await handleMessage(sock, user, m);
    } catch (e) {
      if (e?.name === "SessionError") return; // crypto reset → ignore
      throw e;
    }
  });

  return sock;
};
