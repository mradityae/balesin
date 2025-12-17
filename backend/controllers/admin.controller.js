const User = require("../models/User");
const Bot = require("../models/Bot");
const botManager = require("../bot/botManager");
const { clearSession } = require("../bot/sessionManager");

exports.listUsers = async (req, res) => {
  const users = await User.find({role : {$ne : "admin"}}).select("-passwordHash");
  res.json(users);
};

exports.activateSubscription = async (req, res) => {
  const { userId, days } = req.body;

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(userId, {
    subscribedUntil: until,
  });

  res.json({
    success: true,
    subscribedUntil: until,
  });
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ BLOK DELETE JIKA MASIH AKTIF
    if (user.subscribedUntil && user.subscribedUntil > new Date()) {
      return res.status(400).json({
        message: "User masih aktif. Nonaktifkan terlebih dahulu sebelum delete.",
      });
    }

    // 🛑 STOP BOT (AMAN)
    try {
      await BotManager.stop(userId);
    } catch (e) {
      console.warn("Bot stop skipped:", e?.message || e);
    }

    // 🧹 CLEAR SESSION (AMAN)
    try {
      clearSession(userId);
    } catch (e) {
      console.warn("Session clear skipped:", e?.message || e);
    }

    // 🗑️ DELETE BOT RECORD
    await Bot.deleteOne({ uid: userId });

    // 🗑️ DELETE USER
    await User.findByIdAndDelete(userId);

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteUser error:", err?.stack || err);
    return res.status(500).json({
      message: err?.message || "Delete user failed",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ BLOK DELETE JIKA MASIH AKTIF
    if (user.subscribedUntil && user.subscribedUntil > new Date()) {
      return res.status(400).json({
        message: "User masih aktif. Nonaktifkan terlebih dahulu sebelum delete.",
      });
    }

    // 🛑 STOP BOT (AMAN)
    try {
      await BotManager.stop(userId);
    } catch (e) {
      console.warn("Bot stop skipped:", e?.message || e);
    }

    // 🧹 CLEAR SESSION (AMAN)
    try {
      clearSession(userId);
    } catch (e) {
      console.warn("Session clear skipped:", e?.message || e);
    }

    // 🗑️ DELETE BOT RECORD
    await Bot.deleteOne({ uid: userId });

    // 🗑️ DELETE USER
    await User.findByIdAndDelete(userId);

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteUser error:", err?.stack || err);
    return res.status(500).json({
      message: err?.message || "Delete user failed",
    });
  }
};


exports.deactivateSubscription = async (req, res) => {
  const { userId } = req.body;

  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1);

  botManager.stop(userId);

  await Bot.updateOne(
    { uid: userId },
    {
      $set: {
        connected: false,
        qr: null,
        updatedAt: new Date(),
      },
    }
  );

  await User.findByIdAndUpdate(userId, {
    subscribedUntil: expiredDate,
  });

  res.json({ success: true });
};



