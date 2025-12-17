const fs = require("fs");
const path = require("path");

exports.getSessionPath = (uid) => {
  const p = path.join(__dirname, "..", "sessions", uid.toString());
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
};

exports.clearSession = (uid) => {
  const p = path.join(__dirname, "..", "sessions", uid.toString());
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
};
