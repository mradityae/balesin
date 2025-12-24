const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/bot", require("./routes/bot.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/business", require("./routes/business.routes"));
app.use("/api/uploads", express.static("uploads"));
app.use("/api/payment-proof", require("./routes/paymentProofRoutes"));

// ===== STATIC FOLDER UNTUK UPLOADS =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


module.exports = app;
