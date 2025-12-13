const express = require("express");
const app = express();

const PORT = process.env.PORT || 3010;

// ================= CONFIG =================
const DAILY_ROI = 0.012; // 1.2%
const MIN_WITHDRAW = 35;
const WITHDRAW_FEE_PERCENT = 2;

// ================= STORAGE (TEMP) =================
const users = [];
const deposits = [];

// ================= COMPANY WALLET =================
const COMPANY_WALLET = {
  address: "0xD24B38c66a63698c50ad97b86f545a19D612c68a",
  network: "BEP20",
  coin: "USDT"
};

app.use(express.json());

// ================= HELPERS =================
function generateReferralCode() {
  return "WX" + Math.floor(100000 + Math.random() * 900000);
}

// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { email, referralCode } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const id = users.length + 1;
  const myReferralCode = generateReferralCode();

  let referredBy = null;
  if (referralCode) {
    const parent = users.find(u => u.referralCode === referralCode);
    if (!parent) {
      return res.status(400).json({ error: "Invalid referral code" });
    }
    referredBy = parent.id;
  }

  const user = {
    id,
    email,
    referralCode: myReferralCode,
    referredBy,
    walletBalance: 0,
    levelIncome: 0,
    stake: 0,
    startDate: null,
    deposits: [],
    withdrawRequests: []
  };

  users.push(user);

  res.json({
    message: "User registered",
    userId: id,
    referralCode: myReferralCode
  });
});

// ================= LEVEL INCOME =================
function distributeLevelIncome(userId, amount) {
  const commissions = [0.13, 0.10, 0.08, 0.05, 0.13, 0.08, 0.08];
  let current = users.find(u => u.id === userId);
  let level = 0;

  while (current && current.referredBy && level < commissions.length) {
    const parent = users.find(u => u.id === current.referredBy);
    if (!parent) break;

    const income = amount * commissions[level];
    parent.walletBalance += income;
    parent.levelIncome += income;

    current = parent;
    level++;
  }
}

// ================= USER DEPOSIT =================
app.post("/deposit", (req, res) => {
  const { userId, amount, txHash } = req.body;

  const user = users.find(u => u.id == userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
  if (!txHash) return res.status(400).json({ error: "Tx hash required" });

  const deposit = {
    id: deposits.length + 1,
    userId,
    amount,
    txHash,
    coin: "USDT",
    network: "BEP20",
    walletAddress: COMPANY_WALLET.address,
    status: "pending",
    date: new Date()
  };

  deposits.push(deposit);
  user.deposits.push(deposit);

  res.json({
    message: "Deposit submitted, waiting for approval",
    companyWallet: COMPANY_WALLET,
    deposit
  });
});

// ================= ADMIN DEPOSITS =================
app.get("/admin/deposits", (req, res) => {
  res.json(deposits.filter(d => d.status === "pending"));
});

app.post("/admin/approve-deposit", (req, res) => {
  const { depositId } = req.body;

  const deposit = deposits.find(d => d.id == depositId);
  if (!deposit || deposit.status !== "pending") {
    return res.status(400).json({ error: "Invalid deposit" });
  }

  const user = users.find(u => u.id === deposit.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.walletBalance += deposit.amount;

  if (!user.stake) {
    user.stake = deposit.amount;
    user.startDate = new Date();
  } else {
    user.stake += deposit.amount;
  }

  distributeLevelIncome(user.id, deposit.amount);

  deposit.status = "approved";
  deposit.approvedAt = new Date();

  res.json({ message: "Deposit approved" });
});

// ================= ROI =================
app.get("/roi/:id", (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user || !user.stake || !user.startDate) {
    return res.json({ profit: 0 });
  }

  const days = Math.floor(
    (Date.now() - new Date(user.startDate)) / (1000 * 60 * 60 * 24)
  );

  const profit = user.stake * DAILY_ROI * days;

  res.json({
    stake: user.stake,
    days,
    profit: Number(profit.toFixed(2))
  });
});

// ================= WITHDRAW =================
app.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;
  const user = users.find(u => u.id == userId);

  if (!user) return res.status(404).json({ error: "User not found" });
  if (amount < MIN_WITHDRAW) return res.status(400).json({ error: "Min $35" });
  if (user.walletBalance < amount) return res.status(400).json({ error: "Low balance" });

  const fee = (amount * WITHDRAW_FEE_PERCENT) / 100;
  const request = {
    amount,
    fee,
    finalAmount: amount - fee,
    status: "pending",
    date: new Date()
  };

  user.walletBalance -= amount;
  user.withdrawRequests.push(request);

  res.json({ message: "Withdraw requested", request });
});

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("WealthX backend running");
});

app.get("/admin/ping", (req, res) => {
  res.json({ status: "Admin backend connected" });
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});