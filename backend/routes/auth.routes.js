const r = require("express").Router();
const c = require("../controllers/auth.controller");
const verifyToken = require("../middleware/auth.middleware");

r.post("/register", c.register);
r.post("/login", c.login);
r.put("/profile", verifyToken, c.updateProfile); // Endpoint update profile

module.exports = r;
