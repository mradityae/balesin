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
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  let isDead = false; // prevent zombie events

  /* ============================
        CONNECTION HANDLER
  ============================ */
  sock.ev.on("connection.update", async (update) => {

    if (isDead) return;
    const { connection, qr, lastDisconnect } = update;


    /* ============================
           HANDLE QR CODE
    ============================ */
    if (qr) {
      const dataUrl = await qrcode.toDataURL(qr);
      await Bot.findOneAndUpdate(
        { uid: user._id },
        { qr: dataUrl, connected: false },
        { upsert: true }
      );
    }


    /* ============================
           CONNECTED
    ============================ */
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
    }


    /* ============================
           DISCONNECTED
    ============================ */
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log("Logged out:", user._id);
        isDead = true;
        return;
      }

      console.log("🔁 Trying reconnect by restarting socket...");

      try {
          await sock.ws.close(); 
      } catch {}

      isDead = true;

      setTimeout(() => {
        createBot(user);        
      }, 1000);
    }
  });

  /* ============================
        SAVE CREDS SAFE
  ============================ */
  sock.ev.on("creds.update", async () => {
    try {
      await saveCreds();
    } catch (err) {
      if (err.code === "ENOENT") {
        console.warn("⚠️ creds skipped (ENOENT)");
        return;
      }
      throw err;
    }
  });



  /* ============================
        MESSAGE HANDLER
  ============================ */
  sock.ev.on("messages.upsert", async (m) => {
    if (isDead) return;

    try {
      await handleMessage(sock, user, m);

    } catch (err) {
      // crypto rotate error → skip
      if (err?.name === "SessionError") return;

      console.log("Message error:", err.message);
    }
  });


  /* ============================
        CLEAN EXIT
  ============================ */
  sock.killInstance = async () => {
    try { await sock.ws.close(); } catch {}
    try { sock.ev.removeAllListeners(); } catch {}
    isDead = true;
  };

  return sock;
};
