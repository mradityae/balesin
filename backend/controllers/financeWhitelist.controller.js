const FinanceWhitelist = require("../models/FinanceWhitelist");
const PaymentProof = require("../models/PaymentProof");
const { normalize } = require("../utils/normalize");

const getActivePlan = async (userId) => {
  return PaymentProof.findOne({
    userId,
    status: "approved",
  }).sort({ createdAt: -1 });
};

exports.list = async (req, res) => {
  const userId = req.userFull._id;

  const data = await FinanceWhitelist.find({ userId });
  res.json(data);
};

exports.add = async (req, res) => {
  const { phone, label, roleName } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone required" });
  const userId = req.userFull._id;

  if (roleName === 'admin'){
    const normalizedPhone = normalize(phone);
    const data = await FinanceWhitelist.create({
      userId,
      phone: normalizedPhone,
      label,
    });
    res.json(data);
    return;
  }

  const plan = await getActivePlan(userId);
  if (!plan) {
    return res.status(403).json({ error: "No active subscription" });
  }

  const limit =
    plan.planName === "Keuangan AI" ? 2 :
    plan.planName === "Bundle Super AI" ? 5 : 0;

  if (limit === 0) {
    return res.status(403).json({ error: "Plan not allowed" });
  }

  const count = await FinanceWhitelist.countDocuments({
    userId,
    isActive: true,
  });

  if (count >= limit) {
    return res.status(400).json({ error: "Whitelist limit reached" });
  }

  const normalizedPhone = normalize(phone);

  const data = await FinanceWhitelist.create({
    userId,
    phone: normalizedPhone,
    label,
  });

  res.json(data);
};

exports.remove = async (req, res) => {
  const userId = req.userFull._id;

  await FinanceWhitelist.deleteOne({
    _id: req.params.id,
    userId,
  });

  res.json({ success: true });
};

exports.toggle = async (req, res) => {
  const userId = req.userFull._id;

  const item = await FinanceWhitelist.findOne({
    _id: req.params.id,
    userId,
  });

  if (!item) return res.status(404).json({ error: "Not found" });

  item.isActive = !item.isActive;
  await item.save();

  res.json(item);
};
