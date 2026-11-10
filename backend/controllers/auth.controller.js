const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { increaseFail, resetFail } = require("../middleware/loginRateLimit");

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "Semua kolom wajib diisi" });
  }

  // Validasi ketat backend: pastikan phone hanya berisi angka
  if (!/^\d+$/.test(phone)) {
    return res.status(400).json({ error: "Nomor WhatsApp hanya boleh berisi angka saja." });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email sudah terdaftar" });

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    phone,
    passwordHash,
  });

  res.json({ success: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    increaseFail(req);
    return res.status(401).json({ error: "Email atau password salah" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    increaseFail(req);
    return res.status(401).json({ error: "Email atau password salah" });
  }

  resetFail(req);

  // Menyertakan phone & role ke dalam token JWT
  const token = jwt.sign(
    { 
      uid: user._id, 
      role: user.role, 
      email: user.email,
      phone: user.phone || "",
      name: user.name || "",
      subscribedUntil : user.subscribedUntil || "",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log(user.subscribedUntil);

  res.json({ token });
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.uid; // Diambil dari middleware verifikasi token JWT
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const { name, email, phone } = req.body;

    // Cek jika email baru sudah digunakan oleh user lain
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email sudah digunakan oleh akun lain" });
      }
      user.email = email;
    }

    // Jika role admin, batasi hanya boleh update email saja
    if (user.role !== "admin") {
      if (name) user.name = name;
      
      if (phone) {
        // Validasi ketat: pastikan phone hanya berisi angka
        if (!/^\d+$/.test(phone)) {
          return res.status(400).json({ message: "Nomor WhatsApp hanya boleh berisi angka saja." });
        }
        user.phone = phone;
      }
    }

    await user.save();

    // Buat token JWT baru dengan data terbaru
    const newToken = jwt.sign(
      { 
        uid: user._id, 
        role: user.role, 
        email: user.email,
        name: user.name || "",
        phone: user.phone || "",
        subscribedUntil : user.subscribeUntil || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Profil berhasil diperbarui",
      token: newToken
    });
  } catch (err) {
    console.error("updateProfile Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};