
require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem");

async function addTestCases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const problem = await Problem.findOne({ slug: "two-sum" });

    if (!problem) {
      console.log("Two Sum problem not found.");
      return;
    }

    problem.testCases = [
      {
        input: "4\n2 7 11 15\n9",
        expectedOutput: "0 1",
        isHidden: false,
      },
      {
        input: "3\n3 2 4\n6",
        expectedOutput: "1 2",
        isHidden: true,
      },
      {
        input: "2\n3 3\n6",
        expectedOutput: "0 1",
        isHidden: true,
      },
    ];

    await problem.save();
    console.log("Two Sum test cases added successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addTestCases();
