# Cybyu Cadet MVP Design

## Purpose

Cybyu is a small verifiable software test-execution demo. It demonstrates one claim only: a displayed software execution result can be tied to an authentic, independently verifiable proof produced with the official Cysic Venus/ZisK workflow available to this environment.

The Cadet workflow is:

**Program → Test → Execute → Cysic Proof → Verify**

The central distinction is:

**Valid proof ≠ bug-free software.**

A valid proof means that the authenticated execution output is genuine. The output may still report failing tests.

## Scope

Cadet includes:

- one tiny feasibility guest that computes `7 × 6 = 42`;
- one correct fixed calculator workload;
- one intentionally buggy fixed calculator workload;
- real proof generation and verification through the current official Cysic workflow;
- persisted authentic proof artifacts for inexpensive repeat verification;
- ordinary deterministic identifiers for program and test input;
- three small Next.js pages;
- concise local filesystem persistence;
- focused automated and manual verification.

Cadet excludes arbitrary code, AI agents, GitHub integration, authentication, accounts, payments, staking, warranties, reputation, CI/CD, teams, databases, and other campaign-stage features.

## Delivery Gate

No frontend will be scaffolded until the tiny proof succeeds.

The feasibility sequence is:

1. Inspect only Git, Rust/Cargo, Node.js, required compiler tools, WSL2/Docker, and GPU/CUDA details relevant to Venus/ZisK.
2. Consult the current official Cysic repository and documentation to identify the real guest build, execution, proof-generation, and verification commands.
3. Build and execute the smallest guest that accepts `7`, computes `7 × 6`, and authenticates output `42` using the interfaces the official workflow actually provides.
4. Generate a real proof and run the real verifier.
5. Save the proof, authenticated output/public inputs, command transcript, logs, durations, backend/version information, and timestamps.

If the primary official path fails because of a concrete hardware or infrastructure requirement, Cybyu will try one likely officially supported alternative using WSL2 or Docker. If that also fails, work stops with a concise blocker report. The project will not scaffold a frontend around a simulated, mocked, or hard-coded proof.

## Architecture

Cybyu uses a feasibility-gated monolith. A small Next.js application will eventually own the three pages, route handlers, JSON metadata, and a thin server-only prover adapter. Proving may execute through WSL2 or Docker when required by the supported toolchain.

The system has four bounded units.

### Official proving workspace

This workspace contains only the guest code and configuration required by the official Venus/ZisK flow. The feasibility guest is implemented first. After it succeeds, the workspace gains the two calculator variants.

### Prover adapter

A server-only TypeScript module maps allowlisted operations to fixed prover commands and paths. It never accepts user-supplied shell fragments, code, filesystem paths, or environment variables. It captures real process output, timings, and stage transitions.

### Artifact repository

The repository stores immutable proof directories plus compact JSON metadata. Large proof files and raw logs remain server-side. JSON records expose only safe metadata and relative internal references.

### Web application

The application contains only `/`, `/prove`, and `/proof/[id]`. It reads backend state and never invents proof stages, delays, timings, validity, or identifiers.

## Workloads

Both calculator workloads use the canonical test vectors:

- `3 × 5 = 15`
- `10 × 4 = 40`
- `-2 × 8 = -16`

### Correct Calculator

The implementation returns `a * b`. Its deterministic summary is:

- total: 3
- passed: 3
- failed: 0
- result: PASS

### Buggy Calculator

The implementation intentionally returns `a + b`. With the same vectors, its deterministic summary is:

- total: 3
- passed: 0
- failed: 3
- result: FAIL

The exact guest/output encoding will follow capabilities exposed by the official SDK. The authenticated proof output or public inputs must bind the proof to the displayed workload execution and test summary. Cybyu will not invent unsupported proof APIs.

## Hashes and Claims

Cybyu computes:

- **Program Hash:** SHA-256 of the exact guest binary or the closest deterministic program artifact supported by the official build.
- **Test/Input Hash:** SHA-256 of a canonical serialization of the fixed test vectors and workload selector.

These are application-level integrity identifiers unless the official proof explicitly includes them as authenticated public inputs. The UI and README will label that distinction accurately. A result hash may be added only if it improves artifact integrity without implying that it is part of the proof.

## Fresh Proof Lifecycle

A fresh generation performs actual work in this order:

1. Prepare an allowlisted workload and canonical input.
2. Execute the guest.
3. Generate a new proof for that execution.
4. Verify that new proof against the exact authenticated execution output/public inputs it covers.
5. Persist immutable artifacts and metadata.
6. Display the resulting proof record.

The UI stages are based on actual backend state:

**Preparing → Executing → Generating proof → Verifying proof → Complete**

The label **Generate Fresh Proof** is reserved exclusively for this operation. Fresh generation is not exposed as an easy-to-trigger public action unless it is cheap and safe in the final environment; at minimum it remains an explicit server-side command used for final end-to-end confirmation.

## Stored Proof Re-verification

Normal demo use reuses an authentic persisted proof to avoid unnecessary proving cost.

Re-verification:

1. loads the original proof;
2. loads the exact original authenticated execution output/public inputs covered by that proof;
3. invokes the real official verifier;
4. records the new verification outcome, duration, and timestamp;
5. displays the existing proof-generation timestamp separately from the latest-verification timestamp.

It does not execute the workload again and does not associate an old proof with a new execution. Its stages are:

**Loading authentic proof → Verifying proof → Complete**

The relevant actions are labeled **Verify Proof** and **Re-verify Proof**.

## Persistence

Each immutable proof artifact record contains only:

- proof ID;
- workload ID and display name;
- program hash;
- canonical test/input hash;
- total, passed, failed, and test result;
- proof verification status;
- actual backend and relevant versions;
- proof-generation duration and timestamp;
- latest-verification duration and timestamp;
- relative references to the proof, authenticated output/public inputs, command transcript, and logs;
- whether the current record came from fresh generation or stored re-verification.

Raw binaries, private machine paths, verbose logs, credentials, and secrets never enter browser responses.

## UI

### Homepage (`/`)

The page presents:

- brand: **Cybyu**;
- tagline: **Don't trust the test result. Prove it.**;
- the required supporting copy;
- **CODE → TEST → EXECUTE → PROVE → VERIFY**;
- one **Run Verified Test** call to action.

### Run Test (`/prove`)

The page contains only the Correct Calculator and Buggy Calculator cards. It explains expected test behavior without conflating that behavior with proof validity.

If no authentic artifact exists, the appropriate action is **Generate Fresh Proof**. If an artifact exists, the normal action is **Verify Proof**. Status output reflects only real backend stages.

### Proof Result (`/proof/[id]`)

The page displays:

- workload;
- actual program and test/input hashes;
- total, passed, and failed counts;
- PASS or FAIL test result;
- VALID or INVALID execution proof;
- actual proving backend;
- proof-generation duration and timestamp;
- latest-verification duration and timestamp;
- **Re-verify Proof** when genuine re-verification is available.

The page prominently states that valid execution proof does not imply bug-free software.

The visual treatment is clean, responsive, and restrained: consistent spacing, readable typography, clear status badges, concise errors, and loading states without elaborate animation.

## Error Handling

Errors are categorized as:

- missing or unsupported prover environment;
- guest build failure;
- guest execution failure;
- proof-generation failure;
- proof-verification failure;
- missing or corrupt artifact metadata.

Server logs retain actionable diagnostics. Browser messages are concise and omit private paths. Verification failure is represented as **Execution Proof: INVALID**, not silently converted to success. A proven failing test workload remains **Test Result: FAIL / Execution Proof: VALID**.

## Security

- Public requests accept exactly two workload IDs.
- Users cannot submit code or shell input.
- Workload IDs map to fixed paths, arguments, and commands.
- Process APIs use argument arrays rather than interpolated shell strings where possible.
- Artifact IDs are strictly validated before filesystem access.
- Proof files, private paths, logs, credentials, and environment details remain server-side.
- No general command runner or upload endpoint exists.

## Verification Strategy

Credit-efficient automated coverage includes:

1. deterministic calculator summary tests;
2. canonical input serialization and hashing tests;
3. artifact schema and read/write tests;
4. workload allowlist and artifact-ID validation tests;
5. prover-output parsing tests using captured real logs;
6. route tests for correct, buggy, invalid, and missing-proof states.

Real integration checks include:

1. one tiny feasibility build, execution, proof generation, and verification;
2. one fresh real proof for each calculator workload;
3. repeated real verification using each stored proof and its original authenticated output;
4. one final end-to-end confirmation only when guest code, input, or proving integration changes warrant it;
5. one desktop and mobile browser smoke test after the real backend works.

Frontend and parser changes reuse captured development fixtures and never trigger expensive proof regeneration by default.

## README Requirements

The README will concisely cover what Cybyu is, the trust problem, the solution, the Cadet workflow, the valid-proof distinction, exact Cysic/Venus/ZisK components actually used, setup and verification commands, stored development fixtures, known environment constraints, and the brief Builder/Deployer/Agent Architect roadmap requested for future campaigns.

Claims about Cysic components will be written only after feasibility research confirms the exact repository, versions, commands, and backend used.

## Stop Condition

Development stops once both workloads have authentic proof artifacts, repeated verification succeeds, the correct workload displays `3/3 PASS / VALID`, the buggy workload displays `FAIL / VALID`, all three responsive pages work without dead controls, and the README accurately documents the implementation. Remaining work is limited to bugs and minimal presentation fixes.