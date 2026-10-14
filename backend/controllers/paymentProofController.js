const PaymentProof = require("../models/PaymentProof");

// Upload bukti
exports.uploadProof = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    
    // Ambil data tambahan dari req.body (FormData)
    const { 
      planName, 
      duration, 
      totalPaid, 
      bankDestination, 
      accountNumber, 
      accountName 
    } = req.body;

    if (!req.file) return res.status(400).json({ error: "File tidak ada" });

    // Gunakan findOneAndUpdate agar jika user upload ulang, data lama terupdate
    const proof = await PaymentProof.findOneAndUpdate(
      { userId },
      {
        imageUrl: `/uploads/${req.file.filename}`,
        status: "pending",
        // Simpan data tambahan ke database
        planName,
        duration: Number(duration),
        totalPaid: Number(totalPaid),
        bankDestination,
        accountNumber,
        accountName,
        createdAt: Date.now() // Reset waktu upload
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Upload berhasil", proof });

  } catch (err) {
    console.error("Error Upload:", err);
    res.status(500).json({ error: "Upload gagal" });
  }
};

// Status bukti user (Diperbarui agar mengirim durasi & total bayar)
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
      duration: proof.duration || 1, // Durasi dalam bulan
      totalPaid: proof.totalPaid || 0,
      createdAt: proof.createdAt // Tanggal awal disetujui / dibeli
    });

  } catch (err) {
    res.status(500).json({ error: "Gagal memuat" });
  }
};

// ADMIN: semua bukti (Populate akan menampilkan siapa yang bayar)
exports.getAll = async (req, res) => {
  try {
    const list = await PaymentProof.find()
      .populate("userId", "email role")
      .sort({ createdAt: -1 }); // Tampilkan yang terbaru di atas
    res.json(list);
  } catch {
    res.status(500).json({ error: "Gagal memuat list" });
  }
};

// ADMIN Approve (Tetap sama)
exports.approve = async (req, res) => {
  try {
    await PaymentProof.findByIdAndUpdate(req.params.id, {
      status: "approved",
      note: req.body.note || "Pembayaran dikonfirmasi",
    });
    res.json({ message: "Approved" });
  } catch {
    res.status(500).json({ error: "Gagal approve" });
  }
};

// ADMIN Reject (Tetap sama)
exports.reject = async (req, res) => {
  try {
    await PaymentProof.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      note: req.body.note || "Bukti tidak valid",
    });
    res.json({ message: "Rejected" });
  } catch {
    res.status(500).json({ error: "Gagal reject" });
  }
};