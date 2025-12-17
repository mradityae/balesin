module.exports = (req, res, next) => {
  const { subscribedUntil } = req.userFull || {};
  if (!subscribedUntil) {
    return res.status(403).json({ error: "No subscription" });
  }
  if (new Date(subscribedUntil) < new Date()) {
    return res.status(403).json({ error: "Subscription expired" });
  }
  next();
};
