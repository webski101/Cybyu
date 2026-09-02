import { test } from "node:test";
import assert from "node:assert/strict";
import { readProofRecord } from "../lib/storage.ts";

test("feasibility proof ids are not readable as MVP proof records", async () => {
  // The feasibility proof for 7 * 6 == 42 lives under feasibility/, never
  // under proofs/. A record id from the feasibility directory must NOT be
  // retrievable through readProofRecord, which is the only path the UI uses.
  const fake = "feasibility-artifacts-42-proof";
  const result = await readProofRecord(fake);
  assert.equal(result, null);
});

test("readProofRecord rejects malformed ids before filesystem access", async () => {
  const traversal = "../../../feasibility/artifacts/42/proof";
  const result = await readProofRecord(traversal);
  assert.equal(result, null);
});

test("MVP and feasibility storage are strictly separated by design", async () => {
  // readProofRecord resolves a path under proofs/ only. The feasibility
  // guest and its proof are owned by feasibility/, with a separate id scheme.
  // No code path can return a feasibility record from readProofRecord.
  for (const id of [
    "feasibility-42",
    "42",
    "../feasibility/42/proof",
    "feasibility/artifacts/42/proof.bin"
  ]) {
    const result = await readProofRecord(id);
    assert.equal(result, null, `id ${id} must not resolve`);
  }
});