const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { increaseFail, resetFail } = require("../middleware/loginRateLimit");
const axios = require("axios");

exports.register = async (req, res) => {
  const { name, email, password, captcha } = req.body;

  if (!captcha) {
    return res.status(400).json({ error: "Captcha required" });
  }

  const verify = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`
  );

  if (!verify.data.success) {
    return res.status(400).json({ error: "Captcha invalid" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    passwordHash,
  });

  res.json({ success: true });
};

exports.login = async (req, res) => {
  const { email, password, captcha } = req.body;

  // cek fail count dari middleware
  const failCount = req.failCount;

  // butuh captcha kalau failCount >=3
  if (failCount >= 3) {
    if (!captcha) {
      return res.status(400).json({ error: "Captcha diperlukan" });
    }

    const verify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`
    );

    if (!verify.data.success) {
      increaseFail(req);
      return res.status(400).json({ error: "Captcha salah" });
    }
  }

  const user = await User.findOne({ email });

  if (!user) {
    increaseFail(req);
    return res.status(401).json({ error: "Invalid" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    increaseFail(req);
    return res.status(401).json({ error: "Invalid" });
  }

  resetFail(req);

  const token = jwt.sign(
    { uid: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};
