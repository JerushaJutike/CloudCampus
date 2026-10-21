const r = require("express").Router();
const c = require("../controllers/courseController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
r.get("/", c.list);
r.get("/:id/quizzes", authenticate, c.quizzes);
r.get("/:id", optionalAuthenticate, c.get);
r.post("/:id/enroll", authenticate, c.enroll);
module.exports = r;
