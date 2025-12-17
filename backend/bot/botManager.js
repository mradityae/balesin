const createBot = require("./createBot");

class BotManager {
  constructor() {
    this.instances = new Map();
  }

  async start(user) {
    const key = user._id.toString();
    if (this.instances.has(key)) return;

    const bot = await createBot(user);
    this.instances.set(key, bot);
  }

  async stop(uid) {
    const key = uid.toString();
    const sock = this.instances.get(key);
    if (!sock) return;

    try {
      await sock.logout();
      await new Promise(r => setTimeout(r, 500));
      sock.end();
    } catch (e) {
      console.error("Stop bot error:", e.message);
    }

    this.instances.delete(key);
  }

  has(uid) {
    return this.instances.has(uid.toString());
  }
}

module.exports = new BotManager();
