const r = require("express").Router();
const c = require("../controllers/interviewController");
const { authenticate } = require("../middleware/auth");
r.get("/", authenticate, c.list);
module.exports = r;
