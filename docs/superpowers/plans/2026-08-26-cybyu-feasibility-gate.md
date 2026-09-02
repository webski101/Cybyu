# Cybyu Feasibility Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and verify one real official Cysic Venus/ZisK proof for a guest that computes `7 × 6 = 42`, or stop with an evidence-backed blocker after one supported alternative.

**Architecture:** This plan creates only an isolated feasibility workspace and immutable evidence bundle. It first records the narrowly relevant environment, then derives the workflow from current official Cysic sources, adapts the smallest official guest example, and runs build → execute → prove → verify once. No Next.js application, calculator workloads, mock prover, or simulated success is permitted in this plan.

**Tech Stack:** Official current Cysic Venus/ZisK toolchain discovered during Task 2; Rust/Cargo and Linux via WSL2 or Docker only when required by that official toolchain; JSON and plain-text evidence files.

---

## Planned File Structure

- `feasibility/README.md` — exact official source URLs, pinned revisions, prerequisites, and reproducible commands actually used.
- `feasibility/environment.json` — narrow environment inventory relevant to the prover.
- `feasibility/workflow.json` — machine-readable command manifest copied from or minimally adapted from official documentation.
- `feasibility/guest/` — smallest guest/host files derived from the official example; exact files depend on the pinned SDK layout and must not be invented before source inspection.
- `feasibility/artifacts/42/` — immutable proof, authenticated output/public inputs, hashes, timings, logs, and command transcript from the successful run.
- `feasibility/BLOCKER.md` — created only if both the primary official path and one supported alternative fail.

The official SDK/repository is cloned outside `feasibility/guest/` under `vendor/` at a pinned revision and is not modified. Only the minimum example files required for the guest are copied or referenced.

### Task 1: Record the narrow prover environment

**Files:**
- Create: `feasibility/environment.json`
- Create: `feasibility/logs/environment.txt`

- [ ] **Step 1: Inspect only required local tools**

Run from the workspace root:

```bash
{
  git --version
  rustc --version
  cargo --version
  node --version
  npm --version
  cc --version
  cmake --version
  docker --version
  wsl.exe --status
  nvidia-smi
} > feasibility/logs/environment.txt 2>&1
```

Expected: each available tool reports a version or status. Missing commands are evidence, not a reason to install anything yet.

- [ ] **Step 2: Write the machine-readable inventory**

Create `feasibility/environment.json` with this shape, using exact observed values and `null` for unavailable tools:

```json
{
  "capturedAt": "<ISO-8601 UTC timestamp>",
  "git": null,
  "rustc": null,
  "cargo": null,
  "node": null,
  "npm": null,
  "cc": null,
  "cmake": null,
  "docker": null,
  "wsl": null,
  "gpu": {
    "model": null,
    "driver": null,
    "cuda": null
  }
}
```

The timestamp and values are observations, not implementation placeholders; populate them directly from Step 1.

- [ ] **Step 3: Compare observations only with official prerequisites**

Do not install or upgrade tools in this task. Record discrepancies after Task 2 identifies the current official requirements.

- [ ] **Step 4: Commit when Git becomes available**

Do not retry `git init` while the terminal safety-classifier outage is unchanged. Once Git commands execute normally:

```bash
git init
git add feasibility/environment.json feasibility/logs/environment.txt
git commit -m "chore: record prover feasibility environment"
```

Expected: one local commit; no remote and no push.

### Task 2: Pin the current official workflow without inventing APIs

**Files:**
- Create: `vendor/` clone of the official repository
- Create: `feasibility/README.md`
- Create: `feasibility/workflow.json`
- Create: `feasibility/logs/source-research.txt`

- [ ] **Step 1: Locate official Cysic sources**

Use GitHub CLI and the official docs domain rather than third-party tutorials:

```bash
gh search repos "Venus org:cysic-labs" --limit 20
gh search repos "ZisK org:cysic-labs" --limit 20
gh api orgs/cysic-labs/repos --paginate --jq '.[] | [.name,.html_url,.default_branch,.updated_at] | @tsv'
```

Save the output to `feasibility/logs/source-research.txt`. Accept a repository only when its ownership and official documentation links establish that it is the current Cysic path.

- [ ] **Step 2: Clone only the selected official repository**

Run the clone command using the exact URL found in Step 1:

```bash
git clone --filter=blob:none --no-tags <official-repository-url> vendor/venus
```

Immediately record and pin its revision:

```bash
git -C vendor/venus rev-parse HEAD
git -C vendor/venus remote get-url origin
```

`<official-repository-url>` denotes the exact observed URL from the preceding command and must never be guessed or substituted with an unofficial fork.

- [ ] **Step 3: Extract the documented end-to-end commands**

Read only the repository README, installation documentation, example manifests, and scripts referenced by them. Search for workflow terms:

```bash
git -C vendor/venus grep -n -E "(build|execute|run|prove|verify|ZisK|zisk|guest|example)" -- README.md docs examples scripts
```

If a listed path does not exist, omit only that path and rerun once. Do not search unrelated repository internals unless the documentation points there.

- [ ] **Step 4: Record a command manifest before running the prover**

Write `feasibility/workflow.json` with actual copied commands and source locations:

```json
{
  "repository": "official URL observed in Step 1",
  "revision": "full commit SHA observed in Step 2",
  "documentation": ["official URLs or repository-relative paths"],
  "runtime": "native, WSL2, or Docker as officially supported",
  "requirements": [],
  "commands": {
    "build": ["exact argv copied from official source"],
    "execute": ["exact argv copied from official source"],
    "prove": ["exact argv copied from official source"],
    "verify": ["exact argv copied from official source"]
  },
  "expectedArtifacts": []
}
```

Every string must contain an observed value before this file is saved. If official sources do not define all four phases, stop and record that as the primary-path blocker rather than filling gaps from memory.

- [ ] **Step 5: Document provenance concisely**

In `feasibility/README.md`, list the official URLs, pinned SHA, prerequisite comparison, selected runtime, and exact commands from `workflow.json`. Explicitly state whether Venus wraps ZisK and which named components are actually invoked; do not make broader claims.

- [ ] **Step 6: Commit the pinned workflow when Git is available**

```bash
git add feasibility/README.md feasibility/workflow.json feasibility/logs/source-research.txt
git commit -m "docs: pin official Cysic proving workflow"
```

Do not add the `vendor/venus` checkout to the project commit; add `vendor/` to `.gitignore` if it is not already ignored.

### Task 3: Build the smallest official-style `42` guest

**Files:**
- Create: `feasibility/guest/` files required by the pinned official example
- Create: `feasibility/logs/build.txt`
- Create: `feasibility/logs/execute.txt`
- Create: `feasibility/artifacts/42/input.*`
- Create: `feasibility/artifacts/42/output.*`

- [ ] **Step 1: Copy the smallest documented example structure**

Copy only files named by the official example selected in Task 2. Preserve its host/guest boundary and dependency versions. Do not create a custom proving abstraction.

- [ ] **Step 2: Add the minimal computation**

Adapt the official guest entry point so its logical behavior is exactly:

```rust
fn compute(input: i32) -> i32 {
    input * 6
}
```

Use the official input-reading and authenticated output/commit APIs already present in the example. Supply canonical input `7` through the documented host/input mechanism. Assert or otherwise reject output other than `42` before proof generation when the official example supports host-side output checks.

- [ ] **Step 3: Add a cheap deterministic unit test when the guest crate supports tests**

```rust
#[test]
fn seven_times_six_is_forty_two() {
    assert_eq!(compute(7), 42);
}
```

Run the crate-local test command defined by its manifest:

```bash
cargo test --manifest-path feasibility/guest/Cargo.toml seven_times_six_is_forty_two
```

Expected: one passing test. If the official layout uses a workspace or another language, use its documented equivalent and record that exact command in `feasibility/README.md`.

- [ ] **Step 4: Run the exact recorded build command once**

Invoke the `build` argv from `feasibility/workflow.json` in the documented runtime and capture combined output and duration to `feasibility/logs/build.txt`.

Expected: exit code 0 and the documented guest/program artifact exists. On failure, inspect the log before making one targeted prerequisite correction.

- [ ] **Step 5: Hash the exact program artifact**

Use SHA-256 on the artifact named by the official workflow:

```bash
sha256sum <exact-built-program-artifact> > feasibility/artifacts/42/program.sha256
```

This is an application identifier, not claimed as a proof public input unless official output confirms it.

- [ ] **Step 6: Run the exact recorded execute command once**

Invoke the `execute` argv from `feasibility/workflow.json`, capture logs and duration, and save the exact authenticated output/public-input file under `feasibility/artifacts/42/`.

Expected: exit code 0 and decoded output `42`. If output is not `42`, fix only guest/input encoding and rerun execution; do not start proving.

- [ ] **Step 7: Commit the verified guest when Git is available**

```bash
git add feasibility/guest feasibility/artifacts/42/input.* feasibility/artifacts/42/output.* feasibility/artifacts/42/program.sha256 feasibility/logs/build.txt feasibility/logs/execute.txt
git commit -m "feat: add minimal Cysic feasibility guest"
```

### Task 4: Generate, preserve, and verify one real proof

**Files:**
- Create: `feasibility/artifacts/42/proof.*`
- Create: `feasibility/artifacts/42/metadata.json`
- Create: `feasibility/artifacts/42/commands.txt`
- Create: `feasibility/logs/prove.txt`
- Create: `feasibility/logs/verify.txt`

- [ ] **Step 1: Record the exact fresh-proof command**

Append the fully resolved command, working directory, relevant non-secret environment variables, repository SHA, and UTC start time to `feasibility/artifacts/42/commands.txt`.

- [ ] **Step 2: Run the official prove command once**

Invoke the exact `prove` argv from `feasibility/workflow.json`. Capture combined output, exit code, start/end timestamps, and elapsed milliseconds in `feasibility/logs/prove.txt`.

Expected: exit code 0 and every official expected proof artifact exists. Do not rerun a successful prove.

- [ ] **Step 3: Preserve proof and authenticated data immutably**

Copy the proof, verification key/reference if required, exact authenticated output/public inputs, and any official metadata needed by the verifier to `feasibility/artifacts/42/`. Compute SHA-256 checksums for all copied artifacts:

```bash
sha256sum feasibility/artifacts/42/proof.* feasibility/artifacts/42/output.* > feasibility/artifacts/42/artifacts.sha256
```

- [ ] **Step 4: Run the real official verifier**

Invoke the exact `verify` argv from `feasibility/workflow.json` against the copied proof and its original authenticated output/public inputs. Capture combined output, exit code, timestamps, and elapsed milliseconds in `feasibility/logs/verify.txt`.

Expected: exit code 0 and the official verifier's documented success signal. A process exit alone is insufficient if the tool emits an explicit validity field; record that field.

- [ ] **Step 5: Write immutable metadata**

Create `feasibility/artifacts/42/metadata.json` using observed values:

```json
{
  "input": 7,
  "output": 42,
  "programHashAlgorithm": "sha256",
  "programHash": "observed hash",
  "backend": "exact official backend and version",
  "repositoryRevision": "full pinned SHA",
  "proofGeneratedAt": "observed ISO-8601 UTC timestamp",
  "proofGenerationMs": 0,
  "latestVerifiedAt": "observed ISO-8601 UTC timestamp",
  "latestVerificationMs": 0,
  "proofValid": true,
  "artifactHashes": {}
}
```

Replace all observation labels and zero durations with captured values before saving. Set `proofValid` to `true` only after Step 4's documented validity signal.

- [ ] **Step 6: Re-verify without re-executing or reproving**

Run only the official verifier again using the persisted proof and original authenticated output/public inputs. Update `latestVerifiedAt`, `latestVerificationMs`, and `feasibility/logs/verify.txt`. Do not run the guest or prover.

Expected: the same proof verifies again and proof-generation timestamp remains unchanged.

- [ ] **Step 7: Commit the evidence bundle when Git is available**

Before staging, inspect proof size and `.gitignore`. Commit small textual evidence and only commit binary proof artifacts if their size is reasonable for the repository; otherwise keep a checksum and documented local relative reference.

```bash
git add feasibility/artifacts/42 feasibility/logs/prove.txt feasibility/logs/verify.txt
git commit -m "test: preserve verified Cysic proof for 42 guest"
```

### Task 5: Apply the one-alternative blocker rule

**Files:**
- Create only on failure: `feasibility/BLOCKER.md`
- Modify on success: `feasibility/README.md`

- [ ] **Step 1: Classify a primary-path failure from evidence**

Use the first failing command's exit code and log to identify one exact cause: unsupported OS, missing required compiler, unavailable GPU/CUDA capability, unavailable proving service/credential, insufficient memory/storage, or an official tool defect. Do not attempt speculative fixes.

- [ ] **Step 2: Select at most one officially supported alternative**

Choose WSL2 or Docker only if the pinned official sources support it and it directly addresses the diagnosed cause. Record the official source and why it addresses that cause before running it.

- [ ] **Step 3: Run the alternative once through the failing phase**

Repeat only the minimum affected commands. If proving failed, do not rebuild or re-execute unless the alternative runtime requires compatible artifacts. Capture the alternate command and log separately.

- [ ] **Step 4: Stop or finalize**

If the alternative fails, create `feasibility/BLOCKER.md` with:

```markdown
# Cybyu Feasibility Blocker

## Failed phase
Exact build, execute, prove, or verify phase.

## Primary path
Official source, exact command, exit code, and concise evidence-backed cause.

## Supported alternative tried
Official source, exact command, exit code, and why it did not resolve the cause.

## Required capability
The specific hardware, operating system, service, credential, memory, or upstream fix needed.

## Artifacts
Relative paths to logs and partial outputs.

No proof was simulated, and frontend work did not begin.
```

Populate every sentence from captured evidence. Stop implementation and report the blocker to the user.

If verification succeeds, update `feasibility/README.md` with the exact reproduction and stored re-verification commands and report that the feasibility gate passed. Only then may a separate calculator/backend/frontend implementation plan be written.

- [ ] **Step 5: Run final evidence checks**

On success:

```bash
sha256sum -c feasibility/artifacts/42/artifacts.sha256
```

Expected: every stored artifact reports `OK`.

Confirm the metadata has output `42`, `proofValid: true`, separate generation/latest-verification timestamps, and nonzero observed durations. Confirm no Next.js/package scaffolding exists.

- [ ] **Step 6: Commit final documentation when Git is available**

Success:

```bash
git add feasibility/README.md
git commit -m "docs: document verified feasibility workflow"
```

Blocked:

```bash
git add feasibility/BLOCKER.md feasibility/logs
git commit -m "docs: record Cysic feasibility blocker"
```

## Plan Self-Review

- Scope is restricted to the real `7 × 6 = 42` feasibility gate.
- Official commands are discovered and pinned before use; no Venus/ZisK API or command is invented.
- Proof generation runs once after successful execution and its artifacts are preserved.
- Re-verification uses the original proof and authenticated output without a new execution.
- The blocker path permits exactly one evidence-backed, officially supported alternative.
- Frontend, calculator workloads, mock proof data, and optional campaign features are absent.
- Git initialization is deferred until the existing terminal safety-classifier blocker changes.
