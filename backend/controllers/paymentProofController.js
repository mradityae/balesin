const PaymentProof = require("../models/PaymentProof");
const User = require("../models/User");
const { sendWhatsAppMessage } = require("../src/utils/whatsappSender");

// Upload bukti
exports.uploadProof = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    
    const { 
      planName, 
      duration, 
      totalPaid, 
      bankDestination, 
      accountNumber, 
      accountName 
    } = req.body;

    if (!req.file) return res.status(400).json({ error: "File tidak ada" });

    const proof = await PaymentProof.findOneAndUpdate(
      { userId },
      {
        imageUrl: `/uploads/${req.file.filename}`,
        status: "pending",
        planName,
        duration: Number(duration),
        totalPaid: Number(totalPaid),
        bankDestination,
        accountNumber,
        accountName,
        createdAt: Date.now()
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Upload berhasil", proof });

  } catch (err) {
    console.error("Error Upload:", err);
    res.status(500).json({ error: "Upload gagal" });
  }
};

// Status bukti user
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id;
    const proof = await PaymentProof.findOne({ userId });

    if (!proof) return res.json({ active: false, status: "not_found" });

    res.json({
      active: proof.status === "approved",
      status: proof.status,
      imageUrl: proof.imageUrl,
      planName: proof.planName || "Keuangan AI",
      duration: proof.duration || 1,
      totalPaid: proof.totalPaid || 0,
      createdAt: proof.createdAt
    });

  } catch (err) {
    res.status(500).json({ error: "Gagal memuat" });
  }
};

// ADMIN: semua bukti
exports.getAll = async (req, res) => {
  try {
    const list = await PaymentProof.find()
      .populate("userId", "name email phone role")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ error: "Gagal memuat list" });
  }
};

// ADMIN Approve
exports.approve = async (req, res) => {
  try {
    const note = req.body.note || "Pembayaran dikonfirmasi";
    
    const proof = await PaymentProof.findByIdAndUpdate(
      req.params.id, 
      { status: "approved", note: note },
      { new: true }
    );

    if (!proof) {
      return res.status(404).json({ error: "Data pembayaran tidak ditemukan" });
    }

    const user = await User.findById(proof.userId);
    if (!user) {
      return res.status(404).json({ error: "User pemilik pembayaran tidak ditemukan" });
    }

    console.log("👤 Data User ditemukan:", user.name, "Nomor:", user.phone);

    // Kirim WhatsApp menggunakan fungsi terpisah
    const userName = user.name || "Kak";
    const waMessage = `🎉 *PEMBAYARAN DISETUJUI*\n\n` +
      `Halo *${userName}*,\n` +
      `Pembayaran untuk paket *${proof.planName || "Keuangan AI"}* (${proof.duration || 1} Hari) sebesar *Rp ${Number(proof.totalPaid || 0).toLocaleString("id-ID")}* telah disetujui oleh Admin!\n\n` +
      `💬 *Catatan Admin:* ${note}\n\n` +
      `✨ Nomor WhatsApp Anda (${user.phone}) kini sudah otomatis aktif dan ter-whitelist di Bot Keuangan AI (*0831-9684-5145*). Silakan mulai mencatat keuangan!\n\n` +
      `Terima kasih telah berlangganan! 🙏`;

    await sendWhatsAppMessage(user.phone, waMessage);

    res.json({ message: "Approved dan WhatsApp terkirim via Baileys" });
  } catch (err) {
    console.error("Gagal approve:", err);
    res.status(500).json({ error: "Gagal approve" });
  }
};

// ADMIN Reject
exports.reject = async (req, res) => {
  try {
    const note = req.body.note || "Bukti transfer tidak valid / tidak sesuai";

    const proof = await PaymentProof.findByIdAndUpdate(
      req.params.id, 
      { status: "rejected", note: note },
      { new: true }
    );

    if (!proof) {
      return res.status(404).json({ error: "Data pembayaran tidak ditemukan" });
    }

    const user = await User.findById(proof.userId);
    if (!user) {
      return res.status(404).json({ error: "User pemilik pembayaran tidak ditemukan" });
    }

    console.log("👤 Data User ditemukan:", user.name, "Nomor:", user.phone);

    // Kirim WhatsApp menggunakan fungsi terpisah
    const userName = user.name || "Kak";
    const waMessage = `❌ *PEMBAYARAN DITOLAK*\n\n` +
      `Halo *${userName}*,\n` +
      `Mohon maaf, bukti pembayaran untuk paket *${proof.planName || "Keuangan AI"}* belum dapat kami verifikasi.\n\n` +
      `💬 *Alasan dari Admin:* _${note}_\n\n` +
      `🔄 Silakan login kembali ke dashboard web dan upload ulang bukti transfer yang valid. Terima kasih! 🙏`;

    await sendWhatsAppMessage(user.phone, waMessage);

    res.json({ message: "Rejected dan WhatsApp terkirim via Baileys" });
  } catch (err) {
    console.error("Gagal reject:", err);
    res.status(500).json({ error: "Gagal reject" });
  }
};