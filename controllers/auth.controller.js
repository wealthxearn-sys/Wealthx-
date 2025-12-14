exports.register = (req, res) => {
  res.json({ message: "Account created successfully 🚀" });
};

exports.login = (req, res) => {
  res.json({
    token: "JWT_SAMPLE_TOKEN",
    user: { username: "User123", level: 1, id: "WX-90821" }
  });
};
