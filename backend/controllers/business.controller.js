const Business = require("../models/BusinessProfile");

exports.getBusiness = async (req, res) => {
  const data = await Business.findOne({ userId: req.user.uid });
  res.json(data || null);
};

exports.saveBusiness = async (req, res) => {
  await Business.findOneAndUpdate(
    { userId: req.user.uid },
    { userId: req.user.uid, ...req.body },
    { upsert: true }
  );
  res.json({ success: true });
};
