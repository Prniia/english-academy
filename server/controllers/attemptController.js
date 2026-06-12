const Attempt = require("../models/Attempt");
const Test = require("../models/Test");
const User = require("../models/User");

// CEFR score mapping algorithm
const getLevelFromScore = (score) => {
  if (score <= 25) return "A1";
  if (score <= 40) return "A2";
  if (score <= 55) return "B1";
  if (score <= 70) return "B2";
  if (score <= 85) return "C1";
  return 'C2';
};

// @desc    Submit test answers & calculate score
// @route   POST /api/attempts/submit
exports.submitAttempt = async (req, res) => {
  try {
    const { testId, answers } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!testId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "اطلاعات ارسال شده نامعتبر است" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "آزمون پیدا نشد" });
    }
    if (!test.isActive) {
      return res.status(400).json({ message: "این آزمون غیرفعال است" });
    }

    const totalQuestions = test.questions.length;
    if (totalQuestions === 0) {
      return res.status(400).json({ message: "این آزمون سوالی ندارد" });
    }

    if (answers.length !== totalQuestions) {
      return res.status(400).json({
        message: "تعداد پاسخ‌ها با تعداد سوالات برابر نیست",
        expected: totalQuestions,
        received: answers.length,
      });
    }

    // Evaluate answers
    let correctCount = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (answers[i] === test.questions[i].correctAnswerIndex) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);
    const level = getLevelFromScore(score);

    const newAttempt = await Attempt.create({
      userId,
      testId,
      answers,
      correctAnswers: correctCount,
      totalQuestions,
      score,
      level,
    });

    // Update level of authenticated users
    if (userId) {
      await User.findByIdAndUpdate(userId, { level });
    }

    res.status(201).json({
      message: "نتیجه آزمون با موفقیت ثبت شد",
      result: {
        correctAnswers: newAttempt.correctAnswers,
        totalQuestions: newAttempt.totalQuestions,
        score: newAttempt.score,
        level: newAttempt.level,
      },
      attempt: newAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در ثبت نتیجه آزمون", error: error.message });
  }
};
