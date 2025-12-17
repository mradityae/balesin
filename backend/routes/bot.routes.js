const r = require("express").Router();
const auth = require("../middleware/auth.middleware");
const subscription = require("../middleware/subscription.middleware");
const c = require("../controllers/bot.controller");

r.post("/start", auth, subscription, c.start);
r.get("/status", auth, c.status);
r.post("/reset-session", auth, c.resetSession);

module.exports = r;
