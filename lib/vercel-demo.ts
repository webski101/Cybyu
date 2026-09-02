import "server-only";
import type { ProofRecord } from "./storage";
import { WORKLOADS, type WorkloadId } from "./workloads";
import { verifyBundledProof } from "./vercel-verifier";

const META: Record<WorkloadId, {
  programHash: string;
  inputHash: string;
  outputHash: string;
  proofArtifactReference: string;
  proofGeneratedAt: string;
  proofGenerationMs: number;
}> = {
  correct: {
    programHash: "6d39cb6e53f61e9c1b0e070618fcf8efe0f03850b2ebea0b2265deb677b84fb1",
    inputHash: "325ab6b7973413687f393728051462b1901892de099e3c5bc2447527dca93603",
    outputHash: "cc57fcc173aeb1f8c7ce2b3b08d43bc47c06a4f452fa871fe41f69956502c9ed",
    proofArtifactReference: "verifier/proofs/correct-proof.bin",
    proofGeneratedAt: "2026-08-31T06:30:04.574625Z",
    proofGenerationMs: 1494282
  },
  buggy: {
    programHash: "9a338f74e252b4b5d6f0c5cd808bcd93bfc40f0ddd55449378fe0f19e4fe6704",
    inputHash: "cb39d379a12997ef495270c0efda7edd0f11d1cbc82b8d222989dbabfcb34d12",
    outputHash: "905c3e0e1bf85991fc02bb18a99f986ec86d99daf813aa29f256d3d6209a7465",
    proofArtifactReference: "verifier/proofs/buggy-proof.bin",
    proofGeneratedAt: "2026-08-31T07:34:56.009240Z",
    proofGenerationMs: 2219769
  }
};

export function parseDemoProofId(id: string): WorkloadId | null {
  if (id === "demo-correct") return "correct";
  if (id === "demo-buggy") return "buggy";
  return null;
}

export function demoProofId(workloadId: WorkloadId): string {
  return `demo-${workloadId}`;
}

export async function buildVercelDemoRecord(
  workloadId: WorkloadId,
  verificationCount = 1
): Promise<ProofRecord> {
  const verified = await verifyBundledProof(workloadId);
  const meta = META[workloadId];
  const workload = WORKLOADS[workloadId];
  const createdAt = new Date().toISOString();

  return {
    id: demoProofId(workloadId),
    workloadId,
    workloadTitle: workload.title,
    programHash: meta.programHash,
    inputHash: meta.inputHash,
    outputHash: meta.outputHash,
    testTotal: verified.total,
    testPassed: verified.passed,
    testFailed: verified.failed,
    testResult: verified.result,
    proofStatus: "VALID",
    proverBackend: verified.backend,
    proofGeneratedAt: meta.proofGeneratedAt,
    proofGenerationMs: meta.proofGenerationMs,
    latestVerifiedAt: verified.latestVerifiedAt,
    latestVerificationMs: verified.verificationMs,
    proofArtifactReference: meta.proofArtifactReference,
    createdAt,
    verifications: Array.from({ length: Math.max(1, verificationCount) }, (_, index) => ({
      at: verified.latestVerifiedAt,
      ms: verified.verificationMs,
      ok: true,
      reason: index === 0 ? undefined : "Live re-verification on Vercel"
    }))
  };
}
