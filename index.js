const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/wallet", require("./routes/wallet.routes"));
app.use("/api/reserve", require("./routes/reserve.routes"));
app.use("/api/team", require("./routes/team.routes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 WealthX Backend running on port", PORT);
});
