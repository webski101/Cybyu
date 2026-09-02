import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TEST_VECTORS,
  WORKLOADS,
  applyImplementation,
  hashInput,
  hashProgram,
  isWorkloadId,
  runWorkload
} from "../lib/workloads.ts";

test("test vectors are deterministic and sorted", () => {
  assert.equal(TEST_VECTORS.length, 3);
  assert.deepEqual(
    TEST_VECTORS.map((t) => [t.a, t.b, t.expected]),
    [
      [3, 5, 15],
      [10, 4, 40],
      [-2, 8, -16]
    ]
  );
});

test("correct workload passes all three tests", () => {
  const { summary, results } = runWorkload(WORKLOADS.correct);
  assert.equal(summary.total, 3);
  assert.equal(summary.passed, 3);
  assert.equal(summary.failed, 0);
  assert.equal(summary.result, "PASS");
  assert.ok(results.every((r) => r.passed));
});

test("buggy workload fails all three tests because it adds", () => {
  const { summary, results } = runWorkload(WORKLOADS.buggy);
  assert.equal(summary.total, 3);
  assert.equal(summary.passed, 0);
  assert.equal(summary.failed, 3);
  assert.equal(summary.result, "FAIL");
  assert.ok(results.every((r) => !r.passed));
});

test("applyImplementation computes the documented formula", () => {
  assert.equal(applyImplementation("multiply", 7, 6), 42);
  assert.equal(applyImplementation("add", 7, 6), 13);
  assert.equal(applyImplementation("multiply", -2, 8), -16);
});

test("workload id guard rejects unknown ids", () => {
  assert.equal(isWorkloadId("correct"), true);
  assert.equal(isWorkloadId("buggy"), true);
  assert.equal(isWorkloadId("other"), false);
  assert.equal(isWorkloadId(undefined), false);
});

test("hashes are stable and distinguish correct from buggy", () => {
  const correctHash = hashProgram(Buffer.from("correct-program"));
  const buggyHash = hashProgram(Buffer.from("buggy-program"));
  assert.notEqual(correctHash, buggyHash);
  assert.equal(correctHash.length, 64);

  const correctInput = hashInput(WORKLOADS.correct);
  const buggyInput = hashInput(WORKLOADS.buggy);
  assert.notEqual(correctInput, buggyInput);
});