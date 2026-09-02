import { createHash } from "node:crypto";

export type WorkloadId = "correct" | "buggy";

export type TestVector = {
  id: string;
  a: number;
  b: number;
  expected: number;
};

export const TEST_VECTORS: TestVector[] = [
  { id: "t1", a: 3, b: 5, expected: 15 },
  { id: "t2", a: 10, b: 4, expected: 40 },
  { id: "t3", a: -2, b: 8, expected: -16 }
];

export type WorkloadDefinition = {
  id: WorkloadId;
  title: string;
  description: string;
  expectedResult: "PASS" | "FAIL";
  implementation: "multiply" | "add";
  programFile: string;
  inputPayload: number[];
};

export const WORKLOADS: Record<WorkloadId, WorkloadDefinition> = {
  correct: {
    id: "correct",
    title: "Correct Calculator",
    description: "Multiplies a * b for each test vector.",
    expectedResult: "PASS",
    implementation: "multiply",
    programFile: "correct_calc.riscv",
    inputPayload: TEST_VECTORS.flatMap((t) => [t.a, t.b])
  },
  buggy: {
    id: "buggy",
    title: "Buggy Calculator",
    description: "Adds a + b instead of multiplying.",
    expectedResult: "FAIL",
    implementation: "add",
    programFile: "buggy_calc.riscv",
    inputPayload: TEST_VECTORS.flatMap((t) => [t.a, t.b])
  }
};

export type TestResult = {
  id: string;
  expected: number;
  actual: number;
  passed: boolean;
};

export type TestSummary = {
  total: number;
  passed: number;
  failed: number;
  result: "PASS" | "FAIL";
};

export function applyImplementation(
  implementation: "multiply" | "add",
  a: number,
  b: number
): number {
  return implementation === "multiply" ? a * b : a + b;
}

export function runWorkload(workload: WorkloadDefinition): {
  results: TestResult[];
  summary: TestSummary;
} {
  const results: TestResult[] = TEST_VECTORS.map((t) => {
    const actual = applyImplementation(workload.implementation, t.a, t.b);
    return {
      id: t.id,
      expected: t.expected,
      actual,
      passed: actual === t.expected
    };
  });
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      result: failed === 0 ? "PASS" : "FAIL"
    }
  };
}

export function canonicalInput(workload: WorkloadDefinition): string {
  const ordered = {
    id: workload.id,
    implementation: workload.implementation,
    vectors: TEST_VECTORS
  };
  return JSON.stringify(ordered);
}

export function hashBytes(bytes: Buffer | string, algorithm: "sha256" = "sha256"): string {
  return createHash(algorithm).update(bytes).digest("hex");
}

export function hashProgram(programBytes: Buffer): string {
  return hashBytes(programBytes);
}

export function hashInput(workload: WorkloadDefinition): string {
  return hashBytes(canonicalInput(workload));
}

export function isWorkloadId(value: unknown): value is WorkloadId {
  return value === "correct" || value === "buggy";
}