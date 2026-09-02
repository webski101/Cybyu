import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ProofRecord = {
  id: string;
  workloadId: string;
  workloadTitle: string;
  programHash: string;
  inputHash: string;
  outputHash: string;
  testTotal: number;
  testPassed: number;
  testFailed: number;
  testResult: "PASS" | "FAIL";
  proofStatus: "VALID" | "INVALID";
  proverBackend: string;
  proofGeneratedAt: string | null;
  proofGenerationMs: number | null;
  latestVerifiedAt: string | null;
  latestVerificationMs: number | null;
  proofArtifactReference: string | null;
  createdAt: string;
  verifications: VerificationEvent[];
};

export type VerificationEvent = {
  at: string;
  ms: number;
  ok: boolean;
  reason?: string;
};

const ROOT = path.join(process.cwd(), "proofs");

export async function storeProofRecord(record: ProofRecord): Promise<ProofRecord> {
  await mkdir(ROOT, { recursive: true });
  const file = path.join(ROOT, `${record.id}.json`);
  await writeFile(file, JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function readProofRecord(id: string): Promise<ProofRecord | null> {
  if (!isSafeId(id)) {
    return null;
  }
  try {
    const file = path.join(ROOT, `${id}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ProofRecord;
  } catch {
    return null;
  }
}

export async function listProofRecords(): Promise<ProofRecord[]> {
  try {
    const fs = await import("node:fs/promises");
    const entries = await fs.readdir(ROOT);
    const records: ProofRecord[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      const id = entry.replace(/\.json$/, "");
      const record = await readProofRecord(id);
      if (record) records.push(record);
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function newProofId(): string {
  return randomUUID();
}

function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}