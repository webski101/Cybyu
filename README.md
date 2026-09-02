# Cybyu — Cadet MVP

> AI says the code works. **Cybyu proves what actually happened.**

Cybyu is a small verifiable software test-execution demo. It runs a known
test workload, generates a Cysic ZisK execution proof, and verifies that
proof against the authentic execution output. The proof certifies **what
executed**, not that the program is correct.

## Problem

Developers and AI coding agents can claim that tests passed, but a user may
still need to trust the executor. Cybyu produces independently verifiable
evidence of the execution that produced a given test summary.

## Cadet workflow

`Program → Tests → Execute → ZisK Proof → Verify → Result`

1. Pick one of two allowlisted calculator workloads.
2. Cybyu executes it, generates a real ZisK proof, and verifies it.
3. The result page shows the authentic proof status alongside the test summary.
4. **Re-verify** re-runs the verifier against the stored authentic proof; it
   never re-executes the workload.

## Important distinction

A valid execution proof means the displayed test output was produced by the
program whose hash is shown. It does **not** mean the program is correct. A
buggy workload can produce a perfectly valid proof of a failed test run —
that is the point of the Cadet demo.

## Cysic / ZisK integration

Cybyu uses the official upstream proving path documented at:

- Cysic Venus: <https://github.com/cysic-labs/venus>
- ZisK: <https://github.com/0xPolygonHermez/zisk>
- ZisK Quickstart: <https://0xpolygonhermez.github.io/zisk/getting_started/quickstart.html>

The proof generation command for the Cybyu feasibility guest on the user's
real WSL2 environment is:

```bash
cargo-zisk prove --release --minimal-memory --verify-proof -o proof.bin
```

That command ran end-to-end on the operator's WSL2 Ubuntu with ZisK
v1.2.0-alpha and produced a verified authentic proof (`proof.bin`,
generation time 862.233 s, 246 executed steps).

The feasibility proof is for the tiny `7 * 6 == 42` guest only. It is **not**
associated with any MVP workload record. The `correct` and `buggy`
calculator workloads each have their own guest binary and their own
authentic proof.

## Architecture

```
app/                       Next.js App Router pages and API routes
  page.tsx                 /
  prove/page.tsx           /prove
  proof/[id]/page.tsx      /proof/[id]
  api/workloads/[id]/[op]/ POST /api/workloads/:id/run
  api/proofs/[id]/reverify/ POST /api/proofs/:id/reverify
lib/
  workloads.ts             Allowlisted workloads, canonical input hashing
  runner.ts                External ZisK command runner boundary
  adapter.ts               Server-only pipeline (prepare → execute → prove → verify)
  storage.ts               Filesystem JSON record repository
proofs/                    Generated ProofRecord JSON files
feasibility/               Feasibility evidence and ZisK provenance
```

The prover adapter never accepts user-supplied shell input. It only invokes
an external, narrowly typed runner with one of four allowlisted operations
(`execute`, `prove`, `verify`, `reverify`) for one of two allowlisted
workload ids (`correct`, `buggy`). The runner itself is a small external
program that drives ZisK on the operator's WSL2 Ubuntu runtime.

For the `execute` operation the runner runs `cargo-zisk run --release` (not
`cargo-zisk execute`). For `prove` it runs
`cargo-zisk prove --release --minimal-memory --verify-proof -o proof.bin`.
`verify` and `reverify` both run `cargo-zisk verify -p proof.bin` and never
re-execute the workload; `reverify` must additionally bind the proof to the
stored `inputHash` and `outputHash` recorded by Cybyu.

## Running

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Start the app: `npm start` (after configuring the ZisK runner).
4. Configure the external runner:

   ```bash
   export CYBYU_ZISK_RUNNER=/path/to/cybyu-zisk-runner
   ```

The runner must accept a single JSON argument describing the operation and
print a single JSON `RunnerResult` line to stdout. The interface is
documented in `lib/runner.ts`.

## What this MVP is not

Cybyu Cadet is intentionally small. It does **not** include AI coding
agents, GitHub PR integration, authentication, payments, CYS staking,
warranties, agent reputation, arbitrary uploaded code, CI/CD integration,
team functionality, or a large dashboard. Those are later campaign features.

## Roadmap

- **Builder** — GitHub commits and real developer workflows.
- **Deployer** — Run the proving workflow on supported Cysic infrastructure.
- **Agent Architect** — AI writes code, AI creates adversarial tests,
  execution runs, Cysic proves it, Judge Agent decides.