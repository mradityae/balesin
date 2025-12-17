const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;

    const user = await User.findById(decoded.uid);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: "User inactive" });
    }
    req.userFull = user; // ⬅️ penting
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
