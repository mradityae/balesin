const cron = require("node-cron");
const User = require("../models/User");

// ⬇️ IMPORT FUNGSI YANG SUDAH ADA
const { resetSessionByUserId } = require("../controllers/bot.controller");
// atau kalau filenya beda, sesuaikan path-nya

module.exports = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const expiredUsers = await User.find({
      subscribedUntil: { $lt: now },
    });

    for (const user of expiredUsers) {
      try {
        await resetSessionByUserId(user._id.toString());
        console.log(`🛑 Cron reset session: ${user.email}`);
      } catch (err) {
        console.error(
          `❌ Cron reset failed for ${user.email}:`,
          err.message
        );
      }
    }
  });
};
