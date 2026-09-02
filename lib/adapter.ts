import "server-only";
import { WORKLOADS, WorkloadId, isWorkloadId } from "./workloads";
import {
  RunnerOperation,
  RunnerResult,
  getRunnerConfig,
  invokeRunner,
  runnerUnavailable
} from "./runner";
import {
  ProofRecord,
  newProofId,
  readProofRecord,
  storeProofRecord
} from "./storage";

const ZISK_PROGRAM_HASHES: Record<WorkloadId, string> = {
  correct: "6d39cb6e53f61e9c1b0e070618fcf8efe0f03850b2ebea0b2265deb677b84fb1",
  buggy: "9a338f74e252b4b5d6f0c5cd808bcd93bfc40f0ddd55449378fe0f19e4fe6704"
};

export type PipelineStage =
  | "preparing"
  | "executing"
  | "generating-proof"
  | "verifying-proof"
  | "complete";

export type PipelineEvent = {
  stage: PipelineStage;
  at: string;
  ok: boolean;
  message?: string;
};

export type PipelineResult = {
  ok: boolean;
  stages: PipelineEvent[];
  proofId: string;
  workloadId: WorkloadId;
};

export async function runFullPipeline(
  workloadId: WorkloadId,
  onStage?: (event: PipelineEvent) => void
): Promise<PipelineResult> {
  if (!isWorkloadId(workloadId)) {
    throw new Error(`unknown workload id: ${workloadId}`);
  }
  const workload = WORKLOADS[workloadId];
  const stages: PipelineEvent[] = [];
  const emit = (event: PipelineEvent) => {
    stages.push(event);
    onStage?.(event);
  };
  emit({ stage: "preparing", at: nowIso(), ok: true });
  const programHash = ZISK_PROGRAM_HASHES[workloadId];

  emit({ stage: "executing", at: nowIso(), ok: true });
  const executeResult = await tryRunner({ kind: "execute", workloadId });
  if (!executeResult.ok) {
    emit({ stage: "executing", at: nowIso(), ok: false, message: executeResult.reason });
    return finalize(false, stages, workloadId);
  }

  emit({ stage: "generating-proof", at: nowIso(), ok: true });
  const proveResult = await tryRunner({ kind: "prove", workloadId });
  if (!proveResult.ok) {
    emit({
      stage: "generating-proof",
      at: nowIso(),
      ok: false,
      message: proveResult.reason ?? "no proof path"
    });
    return finalize(false, stages, workloadId);
  }
  if (!proveResult.proofPath) {
    emit({
      stage: "generating-proof",
      at: nowIso(),
      ok: false,
      message: "no proof path returned"
    });
    return finalize(false, stages, workloadId);
  }
  if (!proveResult.guestExecutionSummary) {
    emit({
      stage: "generating-proof",
      at: nowIso(),
      ok: false,
      message: "guest did not return execution summary"
    });
    return finalize(false, stages, workloadId);
  }
  if (!proveResult.inputHash) {
    emit({
      stage: "generating-proof",
      at: nowIso(),
      ok: false,
      message: "guest did not return proof-bound input hash"
    });
    return finalize(false, stages, workloadId);
  }

  if (!proveResult.outputHash) {
    emit({
      stage: "generating-proof",
      at: nowIso(),
      ok: false,
      message: "guest did not return output hash"
    });
    return finalize(false, stages, workloadId);
  }

  emit({ stage: "verifying-proof", at: nowIso(), ok: true });
  const verifyResult = await tryRunner({
    kind: "verify",
    workloadId,
    proofPath: proveResult.proofPath,
    expectedInputHash: proveResult.inputHash,
    expectedOutputHash: proveResult.outputHash
  });
  if (!verifyResult.ok) {
    emit({ stage: "verifying-proof", at: nowIso(), ok: false, message: verifyResult.reason });
    return finalize(false, stages, workloadId);
  }

  emit({ stage: "complete", at: nowIso(), ok: true });
  const proofId = newProofId();
  const summary = proveResult.guestExecutionSummary;
  await storeProofRecord({
    id: proofId,
    workloadId: workload.id,
    workloadTitle: workload.title,
    programHash,
    inputHash: proveResult.inputHash,
    outputHash: proveResult.outputHash,
    testTotal: summary.total,
    testPassed: summary.passed,
    testFailed: summary.failed,
    testResult: summary.result,
    proofStatus: "VALID",
    proverBackend: verifyResult.backend,
    proofGeneratedAt: proveResult.proofGeneratedAt ?? nowIso(),
    proofGenerationMs: proveResult.proofGenerationMs ?? null,
    latestVerifiedAt: verifyResult.latestVerifiedAt ?? nowIso(),
    latestVerificationMs: verifyResult.verificationMs ?? null,
    proofArtifactReference: proveResult.proofPath ?? null,
    createdAt: nowIso(),
    verifications: [
      {
        at: verifyResult.latestVerifiedAt ?? nowIso(),
        ms: verifyResult.verificationMs ?? 0,
        ok: true
      }
    ]
  });
  return { ok: true, stages, proofId, workloadId };
}

export async function reverifyStoredProof(
  proofId: string
): Promise<{ ok: boolean; record?: ProofRecord; reason?: string }> {
  const existing = await readProofRecord(proofId);
  if (!existing) {
    return { ok: false, reason: "proof not found" };
  }
  if (!isWorkloadId(existing.workloadId)) {
    return { ok: false, reason: "stored workload id is not allowlisted" };
  }
  if (!existing.proofArtifactReference) {
    return { ok: false, reason: "stored proof has no artifact reference" };
  }

  const verifyResult = await tryRunner({
    kind: "reverify",
    workloadId: existing.workloadId,
    proofPath: existing.proofArtifactReference,
    expectedInputHash: existing.inputHash,
    expectedOutputHash: existing.outputHash
  });

  const at = verifyResult.ok
    ? verifyResult.latestVerifiedAt ?? nowIso()
    : nowIso();

  const updated: ProofRecord = {
    ...existing,
    proofStatus: verifyResult.ok ? "VALID" : "INVALID",
    proverBackend: verifyResult.ok ? verifyResult.backend : existing.proverBackend,
    latestVerifiedAt: at,
    latestVerificationMs: verifyResult.ok
      ? verifyResult.verificationMs ?? null
      : existing.latestVerificationMs,
    verifications: [
      ...existing.verifications,
      {
        at,
        ms: verifyResult.ok ? verifyResult.verificationMs ?? 0 : 0,
        ok: verifyResult.ok,
        reason: verifyResult.ok ? undefined : verifyResult.reason
      }
    ]
  };
  await storeProofRecord(updated);
  return { ok: verifyResult.ok, record: updated, reason: verifyResult.ok ? undefined : verifyResult.reason };
}

async function tryRunner(operation: RunnerOperation): Promise<RunnerResult> {
  try {
    getRunnerConfig();
    return await invokeRunner(operation);
  } catch (error) {
    const failure = runnerUnavailable((error as Error).message, operation);
    return failure;
  }
}

function finalize(
  ok: boolean,
  stages: PipelineEvent[],
  workloadId: WorkloadId
): PipelineResult {
  return { ok, stages, proofId: "", workloadId };
}

function nowIso(): string {
  return new Date().toISOString();
}