const express = require("express");
const router = express.Router();

router.post("/start", (req, res) => {
  res.json({ message: "Reserve activated 🔁" });
});

router.post("/daily", (req, res) => {
  res.json({ profit: 5 });
});

module.exports = router;
