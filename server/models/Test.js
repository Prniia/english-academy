const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [arrayLimit, "A question must have at least 2 options"],
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
  },
});

function arrayLimit(val) {
  return val.length >= 2;
}

const TestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      required: true,
      min: 1, // list in minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
