require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const runSubscriptionCron = require("./cron/subscription.cron");

/* =====================
   GLOBAL GUARD (SIMPLE)
   ===================== */
process.on("uncaughtException", (e) => {
  if (e?.name === "SessionError" || e?.code === "ENOENT") return;
  console.error(e);
});

process.on("unhandledRejection", (e) => {
  if (e?.name === "SessionError" || e?.code === "ENOENT") return;
  console.error(e);
});

/* =====================
   INIT
   ===================== */
connectDB();
runSubscriptionCron();

app.listen(process.env.PORT, () =>
  console.log("🚀 API running on port", process.env.PORT)
);
