const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode");
const { getSessionPath } = require("./sessionManager");
const Bot = require("../models/Bot");

let SOCKETS = {};
let HEARTBEAT = {};

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const Queue = {};
const Active = {};

async function pushQueue(uid, fn) {
  if (!Queue[uid]) Queue[uid] = [];
  Queue[uid].push(fn);
  run(uid);
}

async function run(uid) {
  if (Active[uid]) return;
  Active[uid] = true;

  while (Queue[uid]?.length) {
    const job = Queue[uid].shift();
    try { await job(); } catch {}
    await wait(1500 + Math.random() * 2000);
  }

  Active[uid] = false;
}

function mutate(text) {
  const endings = ["", " 😊", " ✨", " 🙌", " 👍"];
  return text + endings[Math.floor(Math.random() * endings.length)];
}

async function humanSend(sock, uid, jid, text) {

  await sock.sendPresenceUpdate("composing", jid);
  await wait(1000 + Math.random() * 2000);

  await pushQueue(uid, async () => {
    await sock.sendMessage(jid, { text });
  });

  await sock.sendPresenceUpdate("paused", jid);
}

async function bulkSend(sock, uid, jids, text) {
  let processed = 0;

  for (const jid of jids) {
    await humanSend(sock, uid, jid, mutate(text));
    processed++;

    if (processed % 150 === 0) {
      await wait(60000);
    }
  }
}

async function createBot(user) {

  const uid = user._id.toString();

  async function recreate(reason) {

    console.log("RESTART:", uid, reason);

    try {
      if (SOCKETS[uid]) {
        try { SOCKETS[uid].ws.close(); } catch {}
        try { SOCKETS[uid].end(); } catch {}
      }
    } catch {}

    await wait(1500);
    return createBot(user);
  }

  if (SOCKETS[uid]) {
    try { SOCKETS[uid].ws.close(); } catch {}
    try { SOCKETS[uid].end(); } catch {}
    await wait(800);
  }

  const { state, saveCreds } = await useMultiFileAuthState(
    getSessionPath(uid)
  );

  const sock = SOCKETS[uid] = makeWASocket({
    auth: state,
    keepAliveIntervalMs: 10000,
    syncFullHistory: false,
    printQRInTerminal: false
  });

  HEARTBEAT[uid] = Date.now();

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (up) => {

    const { connection, qr, lastDisconnect } = up;

    if (qr) {
      const img = await qrcode.toDataURL(qr);
      await Bot.findOneAndUpdate(
        { uid },
        { qr: img, connected: false },
        { upsert: true }
      );
    }

    if (connection === "open") {

      await Bot.findOneAndUpdate(
        { uid },
        {
          connected: true,
          qr: null,
          phone: sock.user?.id
        }
      );

      HEARTBEAT[uid] = Date.now();
      console.log("ONLINE:", uid);
    }

    if (connection === "close") {

      const code =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.statusCode;

      if (code === DisconnectReason.loggedOut) {

        await Bot.findOneAndUpdate(
          { uid },
          { connected: false, qr: null }
        );

        return recreate("logout");
      }

      return recreate("connection closed");
    }
  });

  sock.ws.on("error", () => recreate("ws error"));
  sock.ws.on("close", () => recreate("ws close"));

  setInterval(() => {

    const last = HEARTBEAT[uid];
    if (!last) return;

    if (Date.now() - last > 60000) {
      return recreate("heartbeat dead");
    }

  }, 12000);

  sock.ev.on("messages.upsert", async (m) => {

    try {

      HEARTBEAT[uid] = Date.now();

      const handleMessage = require("./messageHandler");

      await handleMessage(sock, user, m, {
        humanSend: (jid, text) => humanSend(sock, uid, jid, text),
        bulkSend: (jids, text) => bulkSend(sock, uid, jids, text),
        rawSend: fn => pushQueue(uid, fn),
        mutate
      });

    } catch (e) {
      console.log("MSG ERROR:", e.message);
    }

  });

  return sock;
}

module.exports = createBot;
