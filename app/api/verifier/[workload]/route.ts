import { NextRequest, NextResponse } from "next/server";
import { chmod, copyFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { isWorkloadId } from "@/lib/workloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARTIFACTS: Record<"correct" | "buggy", string> = {
  correct: "correct-proof.bin",
  buggy: "buggy-proof.bin"
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

function runHost(host: string, workload: "correct" | "buggy", proofPath: string) {
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

function parseOutput(stdout: string) {
  const values: Record<string, string> = {};
  for (const line of stdout.split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i <= 0) continue;
    values[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return values;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { workload: string } }
): Promise<NextResponse> {
  if (!isWorkloadId(params.workload)) {
    return NextResponse.json({ ok: false, error: "unknown workload" }, { status: 404 });
  }

  try {
    const host = await prepareHost();
    const proofPath = path.join(
      process.cwd(),
      "verifier",
      "proofs",
      ARTIFACTS[params.workload]
    );
    const started = Date.now();
    const result = await runHost(host, params.workload, proofPath);
    const verificationMs = Date.now() - started;

    if (result.code !== 0) {
      return NextResponse.json(
        { ok: false, error: result.stderr.slice(-1000) || result.stdout.slice(-1000) },
        { status: 500 }
      );
    }

    const values = parseOutput(result.stdout);
    if (values.verified !== "true" || values.workload !== params.workload) {
      return NextResponse.json(
        { ok: false, error: "verifier output did not authenticate the requested workload" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      workloadId: params.workload,
      total: Number(values.total),
      passed: Number(values.passed),
      failed: Number(values.failed),
      result: values.result,
      verificationMs,
      latestVerifiedAt: new Date().toISOString(),
      backend: "ZisK v1.2.0-alpha / Vercel Linux"
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export const GET = POST;
