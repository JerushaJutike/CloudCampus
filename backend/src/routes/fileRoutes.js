const router = require("express").Router();
const express = require("express");
const crypto = require("node:crypto");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { fail, text } = require("../utils/validation");
const files = require("../services/fileService");
router.use(authenticate);
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id,filename,content_type,size,created_at FROM file_uploads WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
      [req.user.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});
router.post(
  "/",
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    limit: "5mb",
  }),
  async (req, res, next) => {
    try {
      const type = String(req.headers["content-type"] || "").split(";")[0];
      files.validateFile(req.body, type);
      let suppliedName;
      try { suppliedName=decodeURIComponent(req.headers["x-file-name"]||"upload"); }
      catch { fail("Invalid filename encoding"); }
      const filename = text(
        suppliedName,
        "Filename",
        200,
        1,
      ).replace(/[\\/\r\n]/g, "_");
      const id = crypto.randomUUID(),
        key = `${req.user.id}/${id}`;
      try {
        await files.put(key, req.body, type);
      } catch {
        fail("File storage unavailable", 503);
      }
      try {
        await db.query(
          "INSERT INTO file_uploads(id,user_id,object_key,filename,content_type,size) VALUES($1,$2,$3,$4,$5,$6)",
          [id, req.user.id, key, filename, type, req.body.length],
        );
      } catch (error) {
        try {
          await files.remove(key);
        } catch {
          console.error("Upload cleanup pending");
        }
        throw error;
      }
      res
        .status(201)
        .json({
          success: true,
          data: { id, filename, content_type: type, size: req.body.length },
        });
    } catch (error) {
      next(error);
    }
  },
);
router.get("/:fileId", async (req, res, next) => {
  try {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.fileId))
      fail("File not found", 404);
    const result = await db.query(
      "SELECT * FROM file_uploads WHERE id=$1 AND (user_id=$2 OR $3='admin')",
      [req.params.fileId, req.user.id, req.user.role],
    );
    if (!result.rowCount) fail("File not found", 404);
    const file = result.rows[0];
    let stream;
    try {
      stream = await files.get(file.object_key);
    } catch {
      fail("File storage unavailable", 503);
    }
    res.setHeader("Content-Type", file.content_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    stream.on("error", () => {
      if (!res.headersSent)
        res
          .status(503)
          .json({ success: false, message: "File storage unavailable" });
      else res.destroy();
    });
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
