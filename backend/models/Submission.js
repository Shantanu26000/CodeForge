
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    problemSlug: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    language: {
      type: String,
      enum: ["cpp", "javascript", "python"],
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Compilation Error",
        "Time Limit Exceeded",
        "Runtime Error",
        "Execution Error",
      ],
      required: true,
    },
    passed: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    time: {
      type: Number,
      default: 0,
      min: 0,
    },
    memory: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ user: 1, problem: 1, verdict: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
