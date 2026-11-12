const FinancialTransaction = require("../models/FinancialTransaction");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Get Ringkasan Keuangan, Recent Transactions & Chart Data
 */
exports.getFinanceSummary = async (req, res) => {
  try {
    // Ambil userId dari query param (jika dikirim dari frontend) atau fallback ke user yang login (req.user.uid)
    const targetUserId = req.query.userId || req.user.uid;
    const userObjectId = new mongoose.Types.ObjectId(targetUserId);

    // 1. Total Pemasukan vs Pengeluaran (Stat Keseluruhan)
    const stats = await FinancialTransaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const summary = {
      income: stats.find(s => s._id === "INCOME")?.total || 0,
      expense: stats.find(s => s._id === "EXPENSE")?.total || 0
    };

    // 2. Ambil 10 Transaksi Terakhir
    const recentTransactions = await FinancialTransaction.find({ userId: userObjectId })
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    // 3. Data Grafik 7 Hari Terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await FinancialTransaction.aggregate([
      { 
        $match: { 
          userId: userObjectId,
          date: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$totalAmount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$totalAmount", 0] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      success: true,
      summary,
      recentTransactions,
      chartData
    });
  } catch (err) {
    console.error("getFinanceSummary Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete Transaksi berdasarkan ID & Owner
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Format ID transaksi tidak valid" });
    }

    const deleted = await FinancialTransaction.findOneAndDelete({
      _id: transactionId
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (err) {
    console.error("deleteTransaction Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get Semua Transaksi Milik User (Untuk Rekap Lengkap)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.user.uid;
    const userObjectId = new mongoose.Types.ObjectId(targetUserId);

    const transactions = await FinancialTransaction.find({ userId: userObjectId })
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      transactions
    });
  } catch (err) {
    console.error("getAllTransactions Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get Rekapitulasi Keuangan berdasarkan Share Token Publik (Random Character)
 */
exports.getPublicSummaryByToken = async (req, res) => {
  try {
    
    const { token } = req.params;

    // Cari user berdasarkan shareToken
    const user = await User.findOne({ shareToken: token });
    if (!user) {
      return res.status(404).json({ success: false, message: "Link rekap tidak valid atau sudah kedaluwarsa." });
    }

    const userObjectId = user._id;

    // Ambil statistik total pemasukan & pengeluaran
    const stats = await FinancialTransaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const summary = {
      income: stats.find(s => s._id === "INCOME")?.total || 0,
      expense: stats.find(s => s._id === "EXPENSE")?.total || 0
    };

    // Ambil daftar seluruh transaksi user ini
    const transactions = await FinancialTransaction.find({ userId: userObjectId })
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      ownerName: user.name || user.nama || "Pengguna",
      summary,
      transactions
    });
  } catch (err) {
    console.error("getPublicSummaryByToken Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Format ID transaksi tidak valid" });
    }

    // Ambil data yang dikirim dari body request
    const { date, type, vendor, items, totalAmount, source, rawText } = req.body;

    // Siapkan objek update (hanya memperbarui field yang dikirim)
    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (type !== undefined) updateData.type = type;
    if (vendor !== undefined) updateData.vendor = vendor;
    if (items !== undefined) updateData.items = items;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (source !== undefined) updateData.source = source;
    if (rawText !== undefined) updateData.rawText = rawText;

    const updatedTransaction = await FinancialTransaction.findByIdAndUpdate(
      transactionId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Transaksi berhasil diperbarui",
      transaction: updatedTransaction
    });
  } catch (err) {
    console.error("updateTransaction Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};