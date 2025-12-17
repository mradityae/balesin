const r = require("express").Router();
const c = require("../controllers/business.controller");
const auth = require("../middleware/auth.middleware");

r.get("/", auth, c.getBusiness);
r.post("/", auth, c.saveBusiness);

module.exports = r;
