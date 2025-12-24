const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const auth = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/adminOnly");
const ctrl = require("../controllers/paymentProofController");

// USER ROUTES
router.post("/upload", auth, upload.single("image"), ctrl.uploadProof);
router.get("/status", auth, ctrl.getStatus);

// ADMIN ROUTES
router.get("/all", auth, adminOnly, ctrl.getAll);
router.post("/approve/:id", auth, adminOnly, ctrl.approve);
router.post("/reject/:id", auth, adminOnly, ctrl.reject);

module.exports = router;
