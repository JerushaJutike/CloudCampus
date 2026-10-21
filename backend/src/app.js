const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const env = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(require("./middleware/cors"));
app.set("trust proxy", false);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many authentication requests; try again later",
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests; try again later" },
  }),
);
app.use(express.static(path.join(__dirname, "../../frontend")));
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    status: "ok",
    service: "cloud-campus-api",
    time: new Date().toISOString(),
  }),
);
app.get("/api/ready", async (req, res) => {
  try {
    const result = await require("./config/db").query(
      "SELECT 1 FROM schema_migrations WHERE version=$1",
      ["002_files"],
    );
    if (!result.rowCount) throw new Error();
    res.json({ success: true, status: "ready" });
  } catch {
    res
      .status(503)
      .json({
        success: false,
        message: "Database unavailable or migrations pending",
      });
  }
});
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
if (require.main === module) {
  const server = app.listen(env.port, () =>
    console.log(`Cloud Campus is ready to browse: http://localhost:${env.port}/#dashboard`),
  );
  let closing = false;
  const stop = () => {
    if (closing) return;
    closing = true;
    server.close(() =>
      require("./config/db")
        .pool.end()
        .then(() => process.exit(0)),
    );
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
module.exports = app;
