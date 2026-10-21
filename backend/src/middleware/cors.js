const cors = require("cors");
const env = require("../config/env");
const origins = env.corsOrigin
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
module.exports = cors((req, callback) =>
  callback(null, {
    credentials: false,
    origin: (origin, done) => {
      if (!origin) return done(null, true);
      let sameOrigin = false;
      try {
        const url = new URL(origin);
        sameOrigin =
          url.host === req.get("host") &&
          (env.nodeEnv === "production"
            ? url.protocol === "https:"
            : ["http:", "https:"].includes(url.protocol));
      } catch {}
      if (sameOrigin || origins.includes(origin)) return done(null, true);
      done(
        Object.assign(new Error("Origin not allowed by CORS"), { status: 403 }),
      );
    },
  }),
);
