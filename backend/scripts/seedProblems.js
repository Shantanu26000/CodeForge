require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const User = require("../models/User");

const problems = [
  {
    title: "Reverse an Array",
    description: "Given an array of integers, print its elements in reverse order.",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"],
    constraints: ["1 <= n <= 1000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "5\n1 2 3 4 5", output: "5 4 3 2 1", explanation: "Print the elements from last to first." }],
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", isHidden: false },
      { input: "1\n7", expectedOutput: "7", isHidden: true },
      { input: "4\n-1 0 8 2", expectedOutput: "2 8 0 -1", isHidden: true },
    ],
  },
  {
    title: "Sum of Array",
    description: "Given n integers, calculate and print their sum.",
    difficulty: "Easy",
    tags: ["Array", "Math"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "4\n1 2 3 4", output: "10", explanation: "The sum is 1 + 2 + 3 + 4 = 10." }],
    testCases: [
      { input: "4\n1 2 3 4", expectedOutput: "10", isHidden: false },
      { input: "3\n-5 2 1", expectedOutput: "-2", isHidden: true },
      { input: "1\n1000000000", expectedOutput: "1000000000", isHidden: true },
    ],
  },
  {
    title: "Maximum Element",
    description: "Given an array of n integers, print the maximum element.",
    difficulty: "Easy",
    tags: ["Array"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "5\n2 9 -1 7 4", output: "9", explanation: "9 is the largest value in the array." }],
    testCases: [
      { input: "5\n2 9 -1 7 4", expectedOutput: "9", isHidden: false },
      { input: "3\n-8 -2 -11", expectedOutput: "-2", isHidden: true },
      { input: "1\n0", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Count Even Numbers",
    description: "Given n integers, count how many of them are even.",
    difficulty: "Easy",
    tags: ["Array", "Math"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "5\n1 2 4 7 8", output: "3", explanation: "The even values are 2, 4, and 8." }],
    testCases: [
      { input: "5\n1 2 4 7 8", expectedOutput: "3", isHidden: false },
      { input: "4\n-3 -2 0 5", expectedOutput: "2", isHidden: true },
      { input: "3\n1 3 5", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Palindrome Number",
    description: "Given an integer n, print YES if its decimal representation is a palindrome; otherwise print NO. Negative numbers are not palindromes.",
    difficulty: "Easy",
    tags: ["Math", "Strings"],
    constraints: ["-10^9 <= n <= 10^9"],
    examples: [{ input: "1221", output: "YES", explanation: "1221 reads the same forwards and backwards." }],
    testCases: [
      { input: "1221", expectedOutput: "YES", isHidden: false },
      { input: "-121", expectedOutput: "NO", isHidden: true },
      { input: "120", expectedOutput: "NO", isHidden: true },
      { input: "7", expectedOutput: "YES", isHidden: true },
    ],
  },
  {
    title: "Second Largest Distinct",
    description: "Given n integers, print the second largest distinct value. If no such value exists, print -1.",
    difficulty: "Easy",
    tags: ["Array", "Sorting"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "5\n5 1 5 3 2", output: "3", explanation: "The distinct values in descending order begin with 5 and 3." }],
    testCases: [
      { input: "5\n5 1 5 3 2", expectedOutput: "3", isHidden: false },
      { input: "3\n4 4 4", expectedOutput: "-1", isHidden: true },
      { input: "4\n-5 -2 -9 -3", expectedOutput: "-3", isHidden: true },
    ],
  },
  {
    title: "Move Zeroes to End",
    description: "Given an array, move all zeroes to the end while preserving the relative order of non-zero elements. Print the resulting array.",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "6\n0 1 0 3 12 0", output: "1 3 12 0 0 0", explanation: "Non-zero elements retain their order." }],
    testCases: [
      { input: "6\n0 1 0 3 12 0", expectedOutput: "1 3 12 0 0 0", isHidden: false },
      { input: "3\n1 2 3", expectedOutput: "1 2 3", isHidden: true },
      { input: "4\n0 0 0 0", expectedOutput: "0 0 0 0", isHidden: true },
    ],
  },
  {
    title: "Valid Parentheses",
    description: "Given a string containing only the characters (, ), {, }, [, and ], determine whether the brackets are correctly matched and nested. Print YES or NO.",
    difficulty: "Medium",
    tags: ["String", "Stack"],
    constraints: ["1 <= length of s <= 100000"],
    examples: [{ input: "({[]})", output: "YES", explanation: "Every opening bracket is closed in the correct order." }],
    testCases: [
      { input: "({[]})", expectedOutput: "YES", isHidden: false },
      { input: "([)]", expectedOutput: "NO", isHidden: true },
      { input: "(((", expectedOutput: "NO", isHidden: true },
      { input: "[]{}", expectedOutput: "YES", isHidden: true },
    ],
  },
  {
    title: "Binary Search",
    description: "Given a sorted array of n integers and a target x, print the zero-based index of x. If x does not exist, print -1. If x occurs more than once, print its first index.",
    difficulty: "Medium",
    tags: ["Array", "Binary Search"],
    constraints: ["1 <= n <= 100000", "The array is sorted in non-decreasing order"],
    examples: [{ input: "5 4\n1 3 4 4 9", output: "2", explanation: "The first occurrence of 4 is at index 2." }],
    testCases: [
      { input: "5 4\n1 3 4 4 9", expectedOutput: "2", isHidden: false },
      { input: "4 7\n1 2 3 4", expectedOutput: "-1", isHidden: true },
      { input: "1 5\n5", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "First Non-Repeating Character",
    description: "Given a lowercase English string, print the first character that appears exactly once. Print # if every character repeats.",
    difficulty: "Medium",
    tags: ["String", "Hash Table"],
    constraints: ["1 <= length of s <= 100000", "s contains lowercase English letters only"],
    examples: [{ input: "aabbcddee", output: "c", explanation: "c is the first character with frequency one." }],
    testCases: [
      { input: "aabbcddee", expectedOutput: "c", isHidden: false },
      { input: "aabb", expectedOutput: "#", isHidden: true },
      { input: "leetcode", expectedOutput: "l", isHidden: true },
    ],
  },
  {
    title: "Merge Two Sorted Arrays",
    description: "Given two sorted arrays, print their merged sorted sequence. The first line contains n and m, followed by the two arrays on separate lines.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"],
    constraints: ["0 <= n, m <= 100000", "Both arrays are sorted in non-decreasing order"],
    examples: [{ input: "3 3\n1 4 7\n2 3 8", output: "1 2 3 4 7 8", explanation: "Merge both arrays in sorted order." }],
    testCases: [
      { input: "3 3\n1 4 7\n2 3 8", expectedOutput: "1 2 3 4 7 8", isHidden: false },
      { input: "0 2\n\n-1 5", expectedOutput: "-1 5", isHidden: true },
      { input: "2 0\n1 2\n", expectedOutput: "1 2", isHidden: true },
    ],
  },
  {
    title: "Maximum Subarray Sum",
    description: "Given an array of integers, find the maximum sum of a non-empty contiguous subarray.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Kadane"],
    constraints: ["1 <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "The subarray [4, -1, 2, 1] has sum 6." }],
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false },
      { input: "3\n-8 -2 -5", expectedOutput: "-2", isHidden: true },
      { input: "4\n1 2 3 4", expectedOutput: "10", isHidden: true },
    ],
  },
  {
    title: "Number of Islands",
    description: "Given an n by m grid of 0s and 1s, count connected groups of 1s using four-directional adjacency. The first line contains n and m, followed by n grid rows.",
    difficulty: "Medium",
    tags: ["Graph", "BFS", "DFS", "Matrix"],
    constraints: ["1 <= n, m <= 300", "grid contains only 0 and 1"],
    examples: [{ input: "4 5\n11000\n11010\n00100\n00011", output: "3", explanation: "There are three four-directionally connected groups of 1s." }],
    testCases: [
      { input: "4 5\n11000\n11010\n00100\n00011", expectedOutput: "3", isHidden: false },
      { input: "1 1\n1", expectedOutput: "1", isHidden: true },
      { input: "2 3\n000\n000", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Shortest Path in an Unweighted Graph",
    description: "Given an undirected graph with vertices numbered 1 through n, find the shortest number of edges from vertex 1 to vertex n. The first line contains n and m, followed by m edges. Print -1 if n is unreachable.",
    difficulty: "Medium",
    tags: ["Graph", "BFS", "Shortest Path"],
    constraints: ["1 <= n <= 100000", "0 <= m <= 200000"],
    examples: [{ input: "5 5\n1 2\n1 3\n2 4\n3 4\n4 5", output: "3", explanation: "A shortest route from 1 to 5 uses three edges." }],
    testCases: [
      { input: "5 5\n1 2\n1 3\n2 4\n3 4\n4 5", expectedOutput: "3", isHidden: false },
      { input: "3 1\n1 2", expectedOutput: "-1", isHidden: true },
      { input: "1 0", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Kth Largest Element",
    description: "Given an array and an integer k, print the kth largest element counting duplicates. The first line contains n and k, followed by the array.",
    difficulty: "Hard",
    tags: ["Array", "Heap", "Sorting"],
    constraints: ["1 <= k <= n <= 100000", "-10^9 <= a[i] <= 10^9"],
    examples: [{ input: "6 2\n3 2 1 5 6 4", output: "5", explanation: "The second largest element is 5." }],
    testCases: [
      { input: "6 2\n3 2 1 5 6 4", expectedOutput: "5", isHidden: false },
      { input: "4 4\n7 7 2 9", expectedOutput: "2", isHidden: true },
      { input: "5 1\n-3 -1 -9 0 -2", expectedOutput: "0", isHidden: true },
    ],
  },
  {
    title: "Dijkstra Shortest Paths",
    description: "Given a connected or disconnected undirected weighted graph with non-negative edge weights, print the shortest distance from vertex 1 to every vertex from 1 through n. Print -1 for unreachable vertices. The first line contains n and m, followed by m lines u v w.",
    difficulty: "Hard",
    tags: ["Graph", "Dijkstra", "Priority Queue"],
    constraints: ["1 <= n <= 100000", "0 <= m <= 200000", "0 <= w <= 10^9"],
    examples: [{ input: "4 4\n1 2 5\n1 3 1\n3 2 1\n2 4 2", output: "0 2 1 4", explanation: "The shortest distances from vertex 1 are 0, 2, 1, and 4." }],
    testCases: [
      { input: "4 4\n1 2 5\n1 3 1\n3 2 1\n2 4 2", expectedOutput: "0 2 1 4", isHidden: false },
      { input: "3 1\n1 2 7", expectedOutput: "0 7 -1", isHidden: true },
      { input: "1 0", expectedOutput: "0", isHidden: true },
    ],
  },
];

async function main() {
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Check backend/.env");
}

await mongoose.connect(process.env.MONGODB_URI);

  // Prefer an admin account; fall back to the creator of an existing problem.
  let creator = await User.findOne({ role: "admin" }).select("_id").lean();
  if (!creator) {
    const existingProblem = await Problem.findOne().select("createdBy").lean();
    if (existingProblem) creator = { _id: existingProblem.createdBy };
  }

  if (!creator) {
    throw new Error(
      "No admin user or existing problem was found to use as createdBy. Create/promote an admin or set a creator ID before seeding."
    );
  }

  let added = 0;
  let skipped = 0;

  for (const item of problems) {
    const slug = item.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const exists = await Problem.exists({ slug });
    if (exists) {
      skipped++;
      console.log(`SKIP (already exists): ${item.title}`);
      continue;
    }

    await Problem.create({
      ...item,
      slug,
      createdBy: creator._id,
      isPublished: true,
    });
    added++;
    console.log(`ADDED: ${item.title}`);
  }

  console.log(`\nFinished. Added ${added} problems; skipped ${skipped} existing problems.`);
}

main()
  .catch((error) => {
    console.error("Problem seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
