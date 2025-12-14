const express = require("express");
const router = express.Router();

router.get("/balance", (req, res) => {
  res.json({ balance: 250 });
});

router.get("/earnings", (req, res) => {
  res.json({ daily: 5, monthly: 30 });
});

router.get("/history", (req, res) => {
  res.json([
    { type: "Deposit", amount: 100 },
    { type: "Withdrawal", amount: 40 }
  ]);
});

router.post("/stake", (req, res) => {
  res.json({ message: "Stake successful 🔒" });
});

module.exports = router;
