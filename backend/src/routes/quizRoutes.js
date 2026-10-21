const r = require("express").Router();
const c = require("../controllers/quizController");
const { authenticate } = require("../middleware/auth");
r.get("/:id", authenticate, c.get);
r.post("/:id/submit", authenticate, c.submit);
module.exports = r;
