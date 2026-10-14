const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/financeWhitelist.controller");

router.get("/", auth, ctrl.list);
router.post("/", auth, ctrl.add);
router.delete("/:id", auth, ctrl.remove);
router.patch("/:id/toggle", auth, ctrl.toggle);

module.exports = router;
