import "server-only";
import { chmod, copyFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import type { WorkloadId } from "./workloads";

const ARTIFACTS: Record<WorkloadId, string> = {
  correct: "correct-proof.bin",
  buggy: "buggy-proof.bin"
};

export type LiveVerification = {
  workloadId: WorkloadId;
  total: number;
  passed: number;
  failed: number;
  result: "PASS" | "FAIL";
  verificationMs: number;
  latestVerifiedAt: string;
  backend: string;
};

async function prepareHost(): Promise<string> {
  const source = path.join(process.cwd(), "verifier", "bin", "cybyu-host");
  const target = "/tmp/cybyu-host";
  try {
    await stat(target);
  } catch {
    await copyFile(source, target);
    await chmod(target, 0o755);
  }
  return target;
}

function runHost(host: string, workload: WorkloadId, proofPath: string) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn(host, [workload, proofPath], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString("utf8")));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString("utf8")));
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}

function parseOutput(stdout: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of stdout.split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i <= 0) continue;
    values[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return values;
}

export async function verifyBundledProof(workload: WorkloadId): Promise<LiveVerification> {
  const host = await prepareHost();
  const proofPath = path.join(
    process.cwd(),
    "verifier",
    "proofs",
    ARTIFACTS[workload]
  );
  const started = Date.now();
  const result = await runHost(host, workload, proofPath);
  const verificationMs = Date.now() - started;

  if (result.code !== 0) {
    throw new Error(result.stderr.slice(-1000) || result.stdout.slice(-1000) || `verifier exited ${result.code}`);
  }

  const values = parseOutput(result.stdout);
  if (values.verified !== "true" || values.workload !== workload) {
    throw new Error("verifier output did not authenticate the requested workload");
  }
  if (values.result !== "PASS" && values.result !== "FAIL") {
    throw new Error("verifier returned an invalid test result");
  }

  return {
    workloadId: workload,
    total: Number(values.total),
    passed: Number(values.passed),
    failed: Number(values.failed),
    result: values.result,
    verificationMs,
    latestVerifiedAt: new Date().toISOString(),
    backend: "ZisK v1.2.0-alpha / Vercel Linux"
  };
}
