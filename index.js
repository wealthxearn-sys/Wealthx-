const express = require("express");
const app = express();
const port = 3010;

const DAILY_ROI = 0.012; // 1.2% daily ROI
const MIN_WITHDRAW = 35;
const WITHDRAW_FEE_PERCENT = 2;
const deposits = [];
// COMPANY WALLET (USDT BEP20)
const COMPANY_WALLET = {
  address: "0xD24B38c66a63698c50ad97b86f545a19D612c68a",
  network: "BEP20",
  coin: "USDT"
};
app.use(express.json());

const users = [];
function generateReferralCode() {
  return "WX" + Math.floor(100000 + Math.random() * 900000);
}
app.post("/register", (req, res) => {
  const { email, referralCode } = req.body;

  const id = users.length + 1;
  const myReferralCode = generateReferralCode();

  let referredByUser = null;

  if (referralCode) {
    referredByUser = users.find(u => u.referralCode === referralCode);
    if (!referredByUser) {
      return res.status(400).json({ error: "Invalid referral code" });
    }
  }

  const newUser = {
    id,
    email,
    referralCode: myReferralCode,
    referredBy: referredByUser ? referredByUser.id : null,
    teamA: [],
    teamB: [],
    walletBalance: 0,
    levelIncome: 0,

    pendingROI: 0,
    lastROIClaim: new Date()

    deposits: [],           // ✅ ADD THIS
    withdrawRequests: []    // ✅ future use
  };

  users.push(newUser);

  if (referredByUser) {
    referredByUser.teamA.push(id);

    if (referredByUser.referredBy) {
      const parent = users.find(u => u.id === referredByUser.referredBy);
      if (parent) parent.teamB.push(id);
    }
  }

  res.json({
    message: "User registered",
    userId: id,
    referralCode: myReferralCode
  });
});
function distributeLevelIncome(userId, amount) {
  const commissions = [0.13, 0.10, 0.08, 0.05, 0.13, 0.08, 0.08];

  let currentUser = users.find(u => u.id === userId);
  let level = 0;

  while (currentUser && currentUser.referredBy && level < commissions.length) {
    const parent = users.find(u => u.id === currentUser.referredBy);
    if (!parent) break;

    const income = amount * commissions[level];
    parent.walletBalance += income;
    parent.levelIncome += income;

    currentUser = parent;
    level++;
  }
}

/*
User structure:
{
  id: 1,
  stake: 1000,
  startDate: Date,
  profit: 0
}
*/

// FINAL ROI API (1.2% DAILY – POLISHED)
const ROI_DAILY_PERCENT = 0.012;
const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

app.get("/roi/:id", (req, res) => {
  const user = users.find(u => u.id == req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.stake || !user.startDate) {
    return res.json({
      stake: 0,
      days: 0,
      dailyROI: "1.2%",
      profit: 0,
      message: "Stake not active yet"
    });
  }

  const now = new Date();
  const startDate = new Date(user.startDate);

  const daysPassed = Math.floor(
    (now - startDate) / MILLISECONDS_IN_DAY
  );

  if (daysPassed <= 0) {
    return res.json({
      stake: user.stake,
      days: 0,
      dailyROI: "1.2%",
      profit: 0,
      message: "ROI will start from next day"
    });
  }

  const profit = user.stake * ROI_DAILY_PERCENT * daysPassed;

  res.json({
    stake: user.stake,
    days: daysPassed,
    dailyROI: "1.2%",
    profit: Number(profit.toFixed(2))
  });
});
  {
      {
        id: 1,
        stake: 1000,
        startDate: "2025-01-01",
        walletBalance: 0,
        withdrawRequests: []
      }
    ];
  }
];


function calculateMonthlyROI(user) {
  const now = new Date();
  const last = new Date(user.lastROIClaim);

  const diffTime = now - last;
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysPassed <= 0) return;

  const dailyROI = DAILY_ROI; // 1.2%
  const roiEarned = user.stake * dailyROI * daysPassed;

  user.pendingROI += roiEarned;
  user.lastROIClaim = now;
}

// ===============================
// USER DEPOSIT API (MANUAL VERIFY)
// ===============================
app.post("/deposit", (req, res) => {
  const { userId, amount, txHash } = req.body;

  const user = users.find(u => u.id == userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }

  if (!txHash) {
    return res.status(400).json({ error: "Transaction hash required" });
  }

  // ✅ validation ke baad
const deposit = {
  id: deposits.length + 1,
  userId,
  amount,
  txHash,
  coin: "USDT",
  network: "BEP20",
  walletAddress: 0xD24B38c66a63698c50ad97b86f545a19D612c68a
  status: "pending",
  date: new Date()
};

user.deposits.push(deposit);
deposits.push(deposit);

res.json({
  message: "Deposit submitted successfully. Waiting for confirmation.",
  companyWallet: COMPANY_WALLET,
  deposit
});
});


// ❌ iske baad hi response bhejna
res.json({
  message: "Deposit submitted successfully. Waiting for confirmation.",
  companyWallet: COMPANY_WALLET,
  deposit
});
  });
});

// ADMIN - GET ALL PENDING DEPOSITS
app.get("/admin/deposits", (req, res) => {
  const pendingDeposits = deposits.filter(
    d => d.status === "pending"
  );

  res.json({
    total: pendingDeposits.length,
    deposits: pendingDeposits
  });
});

// ADMIN - APPROVE DEPOSIT
app.post("/admin/approve-deposit", (req, res) => {
  const { depositId } = req.body;

  const deposit = deposits.find(d => d.id === depositId);
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }

  if (deposit.status !== "pending") {
    return res.status(400).json({ error: "Deposit already processed" });
  }

  const user = users.find(u => u.id === deposit.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Add balance to user wallet
  user.walletBalance += deposit.amount;

  // 🔥 REFERRAL LEVEL INCOME TRIGGER
distributeLevelIncome(user.id, deposit.amount);

  // START STAKE & ROI
if (!user.stake || user.stake === 0) {
  user.stake = deposit.amount;
  user.startDate = new Date();
} else {
  user.stake += deposit.amount;
}

  // Mark deposit approved
  deposit.status = "approved";
  deposit.approvedAt = new Date();

  res.json({
    message: "Deposit approved successfully",
    userId: user.id,
    newWalletBalance: user.walletBalance
  });
});

// MONTHLY ROI REDEEM (30 DAYS)
app.post("/redeem-roi", (req, res) => {
  const { userId } = req.body;

  const user = users.find(u => u.id == userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.stake || user.stake <= 0) {
    return res.status(400).json({ error: "No active stake found" });
  }

  const now = new Date();

  if (user.lastROIClaimDate) {
    const diffTime = now - new Date(user.lastROIClaimDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return res.status(400).json({
        error: `ROI locked. Redeem after ${30 - diffDays} days`
      });
    }
  }

  // Monthly ROI calculation
  const monthlyROI = user.stake * DAILY_ROI * 30;

  user.walletBalance += monthlyROI;
  user.lastROIClaimDate = now;

  res.json({
    message: "Monthly ROI redeemed successfully",
    roi: monthlyROI.toFixed(2),
    walletBalance: user.walletBalance.toFixed(2),
    nextRedeemAfter: "30 days"
  });
});

app.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;

  const user = users.find(u => u.id == userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (amount < MIN_WITHDRAW) {
    return res.status(400).json({
      error: "Minimum withdraw is $35"
    });
  }

  if (user.walletBalance < amount) {
    return res.status(400).json({
      error: "Insufficient wallet balance"
    });
  }

  const fee = (amount * WITHDRAW_FEE_PERCENT) / 100;
  const finalAmount = amount - fee;

  const request = {
    amount,
    fee,
    finalAmount,
    status: "pending",
    date: new Date()
  };

  user.walletBalance -= amount;
  user.withdrawRequests.push(request);

  res.json({
    message: "Withdraw request submitted",
    request
  });
});
// SERVER START
app.listen(port, () => {
  console.log(`ROI Backend running on port ${port}`);
});