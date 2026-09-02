/**
 * The external ZisK command runner is the boundary between the Next.js app
 * and the operator-installed WSL2 ZisK environment. The runner is a small
 * program that accepts one of the four narrowly typed operations below and
 * returns a JSON line on stdout. The Next.js app never accepts user-supplied
 * shell input and only invokes the runner with an allowlisted workload id.
 */
import { spawn } from "node:child_process";
import { WorkloadId } from "./workloads";

export type RunnerOperation =
  | { kind: "execute"; workloadId: WorkloadId }
  | { kind: "prove"; workloadId: WorkloadId }
  | {
      kind: "verify";
      workloadId: WorkloadId;
      proofPath: string;
      expectedInputHash?: string;
      expectedOutputHash?: string;
    }
  | {
      kind: "reverify";
      workloadId: WorkloadId;
      proofPath: string;
      expectedInputHash?: string;
      expectedOutputHash?: string;
    };

export type GuestExecutionSummary = {
  total: number;
  passed: number;
  failed: number;
  result: "PASS" | "FAIL";
};

export type RunnerSuccess = {
  ok: true;
  kind: RunnerOperation["kind"];
  workloadId: WorkloadId;
  proofPath?: string;
  authenticatedOutput?: string;
  /** Summary returned by the ZisK guest itself, not recomputed locally. */
  guestExecutionSummary?: GuestExecutionSummary;
  /** SHA-256 of the canonical input byte sequence the guest committed to. */
  inputHash?: string;
  /** SHA-256 of the guest's authenticated public output string. */
  outputHash?: string;
  proofGeneratedAt?: string;
  proofGenerationMs?: number;
  verificationMs?: number;
  latestVerifiedAt?: string;
  backend: string;
  notes?: string;
};

export type RunnerFailure = {
  ok: false;
  kind: RunnerOperation["kind"];
  workloadId: WorkloadId;
  reason: string;
};

export type RunnerResult = RunnerSuccess | RunnerFailure;

export type RunnerConfig = {
  /** Absolute path to the small external program that drives ZisK. */
  command: string;
  /** Arguments always prepended to every invocation. */
  args: readonly string[];
  /** Working directory passed to the runner. */
  cwd?: string;
};

const DEFAULT_RUNNER_PATH =
  process.env["CYBYU_ZISK_RUNNER"] ??
  "/home/chisomelvin/cybyu-mvp/bin/cybyu-zisk-runner";

const DEFAULT_CONFIG: RunnerConfig =
  process.platform === "win32"
    ? {
        command: "wsl.exe",
        args: ["--exec", DEFAULT_RUNNER_PATH]
      }
    : {
        command: DEFAULT_RUNNER_PATH,
        args: [],
        cwd: process.env["CYBYU_ZISK_RUNNER_CWD"]
      };

export function getRunnerConfig(): RunnerConfig {
  return DEFAULT_CONFIG;
}

export async function invokeRunner(
  operation: RunnerOperation,
  config: RunnerConfig = DEFAULT_CONFIG
): Promise<RunnerResult> {
  const args = [...config.args, JSON.stringify(operation)];
  return new Promise<RunnerResult>((resolve, reject) => {
    const child = spawn(config.command, args, {
      cwd: config.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`runner exited ${code}: ${stderr.slice(-400)}`));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim().split("\n").pop() ?? "{}") as RunnerResult;
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `runner produced invalid JSON: ${(error as Error).message}; raw=${stdout.slice(-200)}`
          )
        );
      }
    });
  });
}

export function runnerUnavailable(reason: string, operation: RunnerOperation): RunnerFailure {
  return {
    ok: false,
    kind: operation.kind,
    workloadId: operation.workloadId,
    reason
  };
}