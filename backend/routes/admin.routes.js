const r = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const c = require("../controllers/admin.controller");

r.use(auth);
r.use(role("admin"));

r.get("/users", c.listUsers);
r.post("/activate-subscription", c.activateSubscription);
r.post("/delete-user", c.deleteUser);


module.exports = r;
