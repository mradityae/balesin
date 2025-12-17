const BotManager = require("../bot/botManager");
const User = require("../models/User");
const Bot = require("../models/Bot");
const { clearSession } = require("../bot/sessionManager");

exports.start = async (req, res) => {
  const user = await User.findById(req.user.uid);
  await BotManager.start(user);
  await Bot.findOneAndUpdate({ uid: user._id }, {}, { upsert: true });
  res.json({ success: true });
};

exports.status = async (req, res) => {
  const bot = await Bot.findOne({ uid: req.user.uid });
  res.json(bot || { connected: false });
};

async function resetSessionByUserId(userId) {
  if (!userId) {
    throw new Error("userId required");
  }

  await BotManager.stop(userId);
  await new Promise(r => setTimeout(r, 500));
  clearSession(userId);
  await Bot.findOneAndUpdate(
    { uid: userId },
    { connected: false, qr: null, phone: null },
    { upsert: true }
  );
  await User.findByIdAndUpdate(
    userId,
    { subscribedUntil: null }
  );
}

exports.resetSessionByUserId = resetSessionByUserId;

exports.resetSession = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId required" });
    }
    await BotManager.stop(userId);

    // 2️⃣ TUNGGU BAILEYS BERSIH
    await new Promise(r => setTimeout(r, 500));

    // 3️⃣ HAPUS SESSION FILE
    clearSession(userId);
    await Bot.findOneAndUpdate(
      { uid: userId },
      { connected: false, qr: null, phone: null },
      { upsert: true }
    );
    await User.findByIdAndUpdate(
      userId,
      { subscribedUntil: null }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("resetSession error:", err);
    return res.status(500).json({ success: false, message: "Reset session failed" });
  }
};