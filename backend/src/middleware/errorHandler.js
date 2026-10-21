function notFound(req, res) {
  res
    .status(404)
    .json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (["22P02", "23502", "23514", "22001"].includes(err.code))
    return res
      .status(400)
      .json({ success: false, message: "Invalid input value" });
  if (err.code === "23505")
    return res
      .status(409)
      .json({
        success: false,
        message: "A record with that unique value already exists",
      });
  if (err.code === "23503")
    return res
      .status(400)
      .json({ success: false, message: "Referenced record does not exist" });
  if (err.type === "entity.parse.failed")
    return res
      .status(400)
      .json({ success: false, message: "Malformed JSON request body" });
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : 500;
  if (status >= 500)
    console.error({
      event: "request_failed",
      code: err.code || "INTERNAL",
      method: req.method,
    });
  res
    .status(status)
    .json({
      success: false,
      message:
        status >= 500
          ? "Internal server error"
          : err.message || "Request failed",
    });
}
module.exports = { notFound, errorHandler };
