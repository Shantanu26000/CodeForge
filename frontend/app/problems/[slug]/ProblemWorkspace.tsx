
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Play,
  Send,
  RotateCcw,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  executeCode,
  getProblemBySlug,
  submitCode,
  type Problem,
  type ExecutionResult,
  type SubmissionResult,
} from "../../lib/api";

type Language = "cpp" | "javascript" | "python";

type Props = {
  slug: string;
};

const starterCode: Record<Language, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    int target;
    cin >> target;

    unordered_map<int, int> seen;

    for (int i = 0; i < n; i++) {
        int need = target - nums[i];

        if (seen.count(need)) {
            cout << seen[need] << " " << i;
            return 0;
        }

        seen[nums[i]] = i;
    }

    return 0;
}`,
  javascript: `const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);

let pos = 0;
const n = input[pos++];
const nums = input.slice(pos, pos + n);
pos += n;
const target = input[pos];

const seen = new Map();

for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];

    if (seen.has(need)) {
        console.log(seen.get(need), i);
        break;
    }

    seen.set(nums[i], i);
}`,
  python: `n = int(input())
nums = list(map(int, input().split()))
target = int(input())

seen = {}

for i, num in enumerate(nums):
    need = target - num

    if need in seen:
        print(seen[need], i)
        break

    seen[num] = i`,
};

export default function ProblemWorkspace({ slug }: Props) {
  const router = useRouter();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [language, setLanguage] = useState<Language>("cpp");
  const [code, setCode] = useState(starterCode.cpp);
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");

  useEffect(() => {
    let cancelled = false;

    async function loadProblem() {
      setLoadingProblem(true);
      setProblem(null);
      setMessage("");

      try {
        const data = await getProblemBySlug(slug);
        if (!cancelled) setProblem(data.problem);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error ? error.message : "Failed to load problem."
          );
        }
      } finally {
        if (!cancelled) setLoadingProblem(false);
      }
    }

    if (slug) void loadProblem();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setCode(starterCode[nextLanguage]);
    setResult(null);
    setSubmission(null);
    setMessage("");
  }

  function resetCode() {
    setCode(starterCode[language]);
    setResult(null);
    setSubmission(null);
    setMessage("");
  }

  async function handleRun() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setRunning(true);
    setMessage("");
    setResult(null);
    setSubmission(null);
    setActiveTab("output");

    try {
      const response = await executeCode({
        code,
        language,
        input: customInput,
        token,
      });

      setResult(response.result);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Code execution failed."
      );
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setResult(null);
    setSubmission(null);
    setActiveTab("output");

    try {
      const data = await submitCode({
        slug,
        code,
        language,
        token,
      });

      setSubmission(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingProblem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b14] text-slate-300">
        <LoaderCircle className="mr-2 animate-spin" size={20} />
        Loading problem...
      </main>
    );
  }

  if (!problem) {
    return (
      <main className="min-h-screen bg-[#080b14] p-8 text-white">
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-violet-300"
        >
          <ArrowLeft size={18} />
          Back to Problems
        </button>
        <p className="text-red-400">{message || "Problem not found."}</p>
      </main>
    );
  }

  const outputText =
    result?.stdout ||
    result?.compile_output ||
    result?.stderr ||
    (result ? "(No output produced.)" : "");

  const successful = result?.status === "Accepted";
  const busy = running || submitting;

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Problems
        </button>

        <div className="flex items-center gap-2 font-semibold">
          <Code2 className="text-violet-400" />
          CodeForge <span className="text-violet-400">Workspace</span>
        </div>

        <span className="text-xs text-slate-400">Coding workspace</span>
      </header>

      <div className="grid grid-cols-1 lg:h-[calc(100vh-64px)] lg:grid-cols-2">
        <section className="overflow-y-auto border-b border-slate-800 p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{problem.title}</h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                problem.difficulty === "Easy"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : problem.difficulty === "Medium"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <BookOpen size={18} className="text-violet-400" />
            Description
          </h2>

          <p className="whitespace-pre-wrap leading-7 text-slate-300">
            {problem.description}
          </p>

          <h2 className="mb-3 mt-7 text-lg font-semibold">Examples</h2>

          <div className="space-y-4">
            {problem.examples.map((example, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <p className="mb-2 text-sm font-semibold">
                  Example {index + 1}
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-300">
                  <strong>Input:</strong> {example.input}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                  <strong>Output:</strong> {example.output}
                </p>
                {example.explanation && (
                  <p className="mt-2 text-sm text-slate-400">
                    <strong>Explanation:</strong> {example.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {problem.constraints.length > 0 && (
            <>
              <h2 className="mb-3 mt-7 text-lg font-semibold">Constraints</h2>
              <ul className="list-inside list-disc space-y-2 text-sm text-slate-300">
                {problem.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="flex min-h-[650px] flex-col lg:min-h-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#0d1220] px-4 py-3">
            <select
              value={language}
              onChange={(event) =>
                changeLanguage(event.target.value as Language)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
            >
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>

            <button
              onClick={resetCode}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-60"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>

          <div className="min-h-[300px] flex-1 lg:min-h-0">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="shrink-0 border-t border-slate-800 bg-[#0d1220]">
            <div className="flex gap-4 border-b border-slate-800 px-4">
              <button
                onClick={() => setActiveTab("output")}
                className={`py-3 text-sm ${
                  activeTab === "output"
                    ? "border-b-2 border-violet-500 text-white"
                    : "text-slate-400"
                }`}
              >
                Console
              </button>

              <button
                onClick={() => setActiveTab("input")}
                className={`py-3 text-sm ${
                  activeTab === "input"
                    ? "border-b-2 border-violet-500 text-white"
                    : "text-slate-400"
                }`}
              >
                Custom Input
              </button>
            </div>

            {activeTab === "input" ? (
              <textarea
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="Enter standard input here..."
                className="h-24 w-full resize-y bg-[#080b14] p-3 font-mono text-sm outline-none"
              />
            ) : (
              <div className="max-h-56 min-h-20 overflow-y-auto p-3 font-mono text-sm">
                {busy ? (
                  <p className="flex items-center gap-2 text-violet-300">
                    <LoaderCircle size={16} className="animate-spin" />
                    {submitting ? "Evaluating test cases..." : "Running code..."}
                  </p>
                ) : message ? (
                  <p className="flex items-start gap-2 break-words text-red-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {message}
                  </p>
                ) : submission ? (
                  <div className="space-y-3">
                    <div>
                      <p
                        className={`flex items-center gap-2 text-lg font-bold ${
                          submission.verdict === "Accepted"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {submission.verdict === "Accepted" ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <AlertCircle size={19} />
                        )}
                        {submission.verdict}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Test cases passed: {submission.passed}/{submission.total}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total execution time: {submission.time}s · Peak memory:{" "}
                        {submission.memory} KB
                      </p>
                    </div>

                    <div className="space-y-2">
                      {submission.results.map((item) => (
                        <div
                          key={item.testCase}
                          className="rounded-lg border border-slate-800 bg-[#080b14] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-300">
                              Test case {item.testCase}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                item.status === "Passed"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          {item.message && (
                            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-400">
                              {item.message}
                            </pre>
                          )}

                          {item.expectedOutput !== undefined && (
                            <p className="mt-2 text-xs text-slate-400">
                              Expected: {item.expectedOutput}
                            </p>
                          )}

                          {item.actualOutput !== undefined && (
                            <p className="mt-1 text-xs text-slate-400">
                              Your output: {item.actualOutput || "(empty)"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : result ? (
                  <>
                    <p
                      className={`mb-2 flex items-center gap-2 font-semibold ${
                        successful ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {successful ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      {result.status}
                    </p>

                    <pre className="whitespace-pre-wrap break-words text-slate-300">
                      {outputText}
                    </pre>

                    <p className="mt-2 text-xs text-slate-500">
                      Time: {result.time ?? "—"} s · Memory:{" "}
                      {result.memory ?? "—"} KB
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">
                    Run your code to see output, or submit it to evaluate all test
                    cases.
                  </p>
                )}
              </div>
            )}

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-800 bg-[#0d1220] p-3">
              <button
                type="button"
                onClick={handleRun}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {running ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                {running ? "Running..." : "Run"}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
