const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  const { email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash });

  res.json({ success: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid" });

  const token = jwt.sign({ uid: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
};
