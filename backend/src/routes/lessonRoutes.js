const r = require("express").Router();
const c = require("../controllers/learningController");
const { authenticate } = require("../middleware/auth");
r.get("/:id", authenticate, c.getLesson);
r.post("/:id/complete", authenticate, c.complete);
module.exports = r;

