const PaymentProof = require("../models/PaymentProof");

// Upload bukti
exports.uploadProof = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!req.file) return res.status(400).json({ error: "File tidak ada" });

    const proof = await PaymentProof.findOneAndUpdate(
      { userId },
      {
        imageUrl: `/uploads/${req.file.filename}`,
        status: "pending",
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Upload berhasil", proof });

  } catch (err) {
    res.status(500).json({ error: "Upload gagal" });
  }
};

// Status bukti user
exports.getStatus = async (req, res) => {
  try {
    const proof = await PaymentProof.findOne({ userId: req.user.uid });

    if (!proof) return res.json({ active: false, status: "not_found" });

    res.json({
      active: proof.status === "approved",
      status: proof.status,
      imageUrl: proof.imageUrl,
    });

  } catch {
    res.status(500).json({ error: "Gagal memuat" });
  }
};

// ADMIN: semua bukti
exports.getAll = async (req, res) => {
  try {
    const list = await PaymentProof.find().populate("userId", "email role");
    res.json(list);
  } catch {
    res.status(500).json({ error: "Gagal memuat list" });
  }
};

// ADMIN Approve
exports.approve = async (req, res) => {
  try {
    await PaymentProof.findByIdAndUpdate(req.params.id, {
      status: "approved",
      note: req.body.note || "",
    });

    res.json({ message: "Approved" });
  } catch {
    res.status(500).json({ error: "Gagal approve" });
  }
};

// ADMIN Reject
exports.reject = async (req, res) => {
  try {
    await PaymentProof.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      note: req.body.note || "",
    });

    res.json({ message: "Rejected" });
  } catch {
    res.status(500).json({ error: "Gagal reject" });
  }
};
