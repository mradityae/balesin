const createBot = require("./createBot");

class BotManager {

  constructor() {
    this.instances = new Map(); // uid → socket instance
  }

  /* =============================
      START BOT FOR ONE USER
  ============================= */
  async start(user) {

    const key = user._id.toString();

    // already running
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    const sock = await createBot(user);

    this.instances.set(key, sock);

    return sock;
  }



  /* =============================
      STOP BOT FOR ONE USER
  ============================= */
  async stop(uid) {

    const key = uid.toString();
    const sock = this.instances.get(key);

    if (!sock) return;

    try {

      // safely close WA session
      if (sock.killInstance) {
        await sock.killInstance();
      } else {
        try { await sock.ws.close(); } catch {}
      }

    } catch (err) {
      console.log("Stop bot error:", err.message);
    }

    this.instances.delete(key);
  }



  /* =============================
      CHECK IF BOT EXISTS
  ============================= */
  has(uid) {
    return this.instances.has(uid.toString());
  }



  /* =============================
      STOP ALL BOTS (SERVER SHUTDOWN)
  ============================= */
  async stopAll() {

    const ids = [...this.instances.keys()];

    for (const uid of ids) {
      try {
        await this.stop(uid);
      } catch {}
    }

    this.instances.clear();
  }

}

module.exports = new BotManager();
