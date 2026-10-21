const r = require("express").Router();
const c = require("../controllers/practiceController");
const { authenticate } = require("../middleware/auth");
r.use(authenticate);
r.get("/problems", c.list);
r.post("/submissions", c.submit);
r.get("/submissions", c.history);
module.exports = r;
