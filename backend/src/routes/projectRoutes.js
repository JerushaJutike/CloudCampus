const r = require("express").Router();
const c = require("../controllers/projectController");
const { authenticate } = require("../middleware/auth");
r.get("/", authenticate, c.list);
r.post("/:id/submit", authenticate, c.submit);
module.exports = r;
