const Test = require("../models/Test");
const Attempt = require("../models/Attempt");

// @desc    Get all tests (filtered for users, complete for admin)
// @route   GET /api/tests
exports.getTests = async (req, res) => {
  try {
    const isUserAdmin = req.user && req.user.role === "admin";
    
    // Filter active tests for normal users, return all tests to admin
    const filter = isUserAdmin ? {} : { isActive: true };
    const tests = await Test.find(filter);

    const mappedTests = tests.map((test) => {
      const testObj = test.toObject();
      if (!isUserAdmin) {
        // Stripe correct answers out of questions for non-admins
        testObj.questions = testObj.questions.map((q) => {
          const { correctAnswerIndex, ...rest } = q;
          return rest;
        });
      }
      return testObj;
    });

    res.status(200).json(mappedTests);
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت آزمون‌ها", error: error.message });
  }
};

// @desc    Get single test by ID
// @route   GET /api/tests/:id
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "آزمون پیدا نشد" });
    }

    const isUserAdmin = req.user && req.user.role === "admin";
    if (!isUserAdmin && !test.isActive) {
      return res.status(403).json({ message: "این آزمون غیرفعال است" });
    }

    const testObj = test.toObject();
    if (!isUserAdmin) {
      testObj.questions = testObj.questions.map((q) => {
        const { correctAnswerIndex, ...rest } = q;
        return rest;
      });
    }

    res.status(200).json(testObj);
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت آزمون", error: error.message });
  }
};

// @desc    Create new test
// @route   POST /api/tests
exports.createTest = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "عنوان آزمون الزامی است" });
    }
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "مدت زمان آزمون باید عدد مثبت باشد" });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "حداقل یک سوال باید ارسال شود" });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return res.status(400).json({ message: `متن سوال ${i + 1} نامعتبر است` });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `سوال ${i + 1} باید حداقل ۲ گزینه داشته باشد` });
      }
      if (
        typeof q.correctAnswerIndex !== "number" ||
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex >= q.options.length
      ) {
        return res.status(400).json({ message: `پاسخ صحیح سوال ${i + 1} نامعتبر است` });
      }
    }

    const newTest = await Test.create({
      title: title.trim(),
      description: (description || "").trim(),
      duration,
      isActive: true,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctAnswerIndex: q.correctAnswerIndex,
      })),
    });

    res.status(201).json({ message: "آزمون با موفقیت ساخته شد", test: newTest });
  } catch (error) {
    res.status(500).json({ message: "خطا در ساخت آزمون", error: error.message });
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
exports.updateTest = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;

    let test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "آزمون مورد نظر یافت نشد" });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "عنوان آزمون الزامی است" });
    }
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "مدت زمان آزمون باید عدد مثبت باشد" });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "حداقل یک سوال باید ارسال شود" });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return res.status(400).json({ message: `متن سوال ${i + 1} نامعتبر است` });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `سوال ${i + 1} باید حداقل ۲ گزینه داشته باشد` });
      }
      if (
        typeof q.correctAnswerIndex !== "number" ||
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex >= q.options.length
      ) {
        return res.status(400).json({ message: `پاسخ صحیح سوال ${i + 1} نامعتبر است` });
      }
    }

    test.title = title.trim();
    test.description = (description || "").trim();
    test.duration = duration;
    test.questions = questions.map((q) => ({
      questionText: q.questionText.trim(),
      options: q.options.map((opt) => opt.trim()),
      correctAnswerIndex: q.correctAnswerIndex,
    }));

    await test.save();
    res.status(200).json({ message: "آزمون با موفقیت ویرایش شد", test });
  } catch (error) {
    res.status(500).json({ message: "خطا در ویرایش آزمون", error: error.message });
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "آزمون یافت نشد" });
    }

    await Test.findByIdAndDelete(req.params.id);
    // Cascade delete attempts belonging to this test
    await Attempt.deleteMany({ testId: req.params.id });

    res.status(200).json({ message: "آزمون و نتایج مربوطه با موفقیت حذف شدند" });
  } catch (error) {
    res.status(500).json({ message: "خطا در حذف آزمون", error: error.message });
  }
};

// @desc    Toggle test activity status
// @route   PATCH /api/tests/:id/toggle
exports.toggleTestStatus = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "آزمون پیدا نشد" });
    }

    test.isActive = !test.isActive;
    await test.save();

    res.status(200).json({ message: "وضعیت آزمون تغییر کرد", isActive: test.isActive });
  } catch (error) {
    res.status(500).json({ message: "خطا در تغییر وضعیت آزمون", error: error.message });
  }
};
