const r = require("express").Router();
const c = require("../controllers/dashboardController");
const { authenticate } = require("../middleware/auth");
r.get("/", authenticate, c.get);
module.exports = r;
