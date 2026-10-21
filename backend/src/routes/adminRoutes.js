const r = require("express").Router();
const c = require("../controllers/adminController");
const content = require("../controllers/contentController");
const { authenticate, requireRole } = require("../middleware/auth");
r.use(authenticate, requireRole("admin"));
r.get("/stats", c.stats);
r.get("/students", content.students);
r.patch("/students/:id", content.updateStudent);
r.get("/analytics", content.analytics);
r.get("/content/:entity", content.list);
r.post("/content/:entity", content.save);
r.patch("/content/:entity/:id", content.save);
r.delete("/content/:entity/:id", content.archive);
r.get("/courses", (req, res, next) => {
  req.params.entity = "courses";
  content.list(req, res, next);
});
r.post("/courses", (req, res, next) => {
  req.params.entity = "courses";
  content.save(req, res, next);
});
r.patch("/courses/:id", (req, res, next) => {
  req.params.entity = "courses";
  content.save(req, res, next);
});
r.delete("/courses/:id", (req, res, next) => {
  req.params.entity = "courses";
  content.archive(req, res, next);
});
module.exports = r;
