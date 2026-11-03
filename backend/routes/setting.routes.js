const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");

router.get("/pricing", async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: "pricing_config" });
    if (!setting) {
      setting = await Setting.create({
        key: "pricing_config",
        pricePerDay: 2000,
        oldPrice: "250k",
        activePromoText: "Otomatis Whitelist WA"
      });
    }
    return res.status(200).json(setting);
  } catch (err) {
    return res.status(500).json({ error: "Gagal memuat pengaturan harga" });
  }
});

router.put("/pricing", async (req, res) => {
  try {
    const { pricePerDay, oldPrice, activePromoText } = req.body;
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "pricing_config" },
      {
        pricePerDay: Number(pricePerDay) || 2000,
        oldPrice: oldPrice || "250k",
        activePromoText: activePromoText || ""
      },
      { new: true, upsert: true }
    );
    return res.status(200).json({ message: "Berhasil disimpan", setting: updatedSetting });
  } catch (err) {
    return res.status(500).json({ error: "Gagal menyimpan harga" });
  }
});

module.exports = router;