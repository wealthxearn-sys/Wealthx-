const express = require("express");
const router = express.Router();

router.get("/me", (req, res) => {
  res.json({ username: "User123", level: 1, id: "WX-90821" });
});

router.get("/level", (req, res) => {
  res.json({ level: 1, income: "30% monthly" });
});

module.exports = router;
