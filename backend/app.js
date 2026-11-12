const express = require("express");
const cors = require("cors");
const path = require("path");
const { swaggerDocs } = require("./src/config/swagger"); // Import konfigurasi swagger

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/bot", require("./routes/bot.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/business", require("./routes/business.routes"));
app.use("/api/payment-proof", require("./routes/paymentProofRoutes"));
app.use("/api/finance", require("./routes/finance.routes"));
app.use("/api/finance/whitelist", require("./routes/financeWhitelist.routes"));
app.use("/api/settings", require("./routes/setting.routes"));

// ===== STATIC FOLDER UNTUK UPLOADS =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== SETUP SWAGGER UI =====
swaggerDocs(app);

module.exports = app;