const r = require("express").Router();
const c = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
r.post("/register", c.register);
r.post("/login", c.login);
r.get("/me", authenticate, c.me);
r.post("/logout", (req, res) =>
  res.json({
    success: true,
    message: "Remove the bearer token on the client to log out",
  }),
);
module.exports = r;
