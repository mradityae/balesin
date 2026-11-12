const express = require("express");
const router = express.Router();
const financeController = require("../controllers/finance.controller");
const authMiddleware = require("../middleware/auth.middleware"); 

if (!authMiddleware) console.error("ERROR: authMiddleware is undefined!");
if (!financeController.getFinanceSummary) console.error("ERROR: getFinanceSummary is undefined!");

router.get("/", authMiddleware, financeController.getAllTransactions);
router.get("/summary", authMiddleware, financeController.getFinanceSummary);
router.put("/:id", authMiddleware, financeController.updateTransaction); // <-- Rute PUT untuk edit transaksi
router.delete("/:id", authMiddleware, financeController.deleteTransaction);
router.get("/public/:token", financeController.getPublicSummaryByToken);

module.exports = router;