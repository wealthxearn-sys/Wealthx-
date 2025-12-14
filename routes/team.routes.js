const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ totalTeam: 12 });
});

router.get("/active", (req, res) => {
  res.json({ activeTeam: 7 });
});

module.exports = router;
