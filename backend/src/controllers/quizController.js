const s = require("../services/quizService");
exports.get = async (req, res, next) => {
  try {
    const data = await s.getQuiz(req.params.id, req.user.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
exports.submit = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await s.submitQuiz(req.user.id, req.params.id, req.body?.answers),
    });
  } catch (e) {
    next(e);
  }
};
