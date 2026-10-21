const s = require("../services/dashboardService");
exports.get = async (req, res, next) => {
  try {
    res.json({ success: true, data: await s.getDashboard(req.user.id) });
  } catch (e) {
    next(e);
  }
};
