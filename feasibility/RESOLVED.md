# Cybyu Feasibility Blocker — RESOLVED

## Resolution

The feasibility blocker recorded in `feasibility/BLOCKER.md` has been resolved
externally by the operator. A real ZisK v1.2.0-alpha environment was
installed on Ubuntu WSL2 and produced a valid proof for the Cybyu feasibility
guest.

## Verified external results

- ZisK CPU build installed successfully
- Official proving key v1.2.0-alpha downloaded successfully
- Cybyu test guest compiled successfully to RISC-V ELF
- Guest execution succeeded
- Program-specific setup completed successfully
- Real proof generated successfully
- Real proof verified successfully
- Proof saved as `proof.bin`
- Proof generation time: 862.233 seconds
- Executed steps: 246
- No proof was simulated or mocked

## Historical record

The original blocker evidence in `feasibility/BLOCKER.md` is preserved
verbatim. It remains valid documentation of the environment gap that
existed before the operator installed the WSL2 ZisK runtime.

## Implication for the MVP

The ZisK proving toolchain is now reachable only from the real WSL2 Ubuntu
environment, not from this CyOps container. The Next.js application must
therefore keep the proving runtime boundary explicit: a server-only prover
adapter invokes an external ZisK command runner (the operator-provided WSL2
runner) over a single, narrow interface. The UI never receives arbitrary
shell input and only ever asks the adapter to execute, prove, verify, or
re-verify one of the two allowlisted calculator workloads. Re-verification
must verify the stored authentic proof artifact; it must never reuse a proof
artifact against a freshly executed workload.

The `7 * 6 == 42` feasibility proof here is **toolchain evidence only**.
It is never reused as the proof for the `correct` or `buggy` calculator
workloads. Each of those two workloads has its own guest binary and its own
authentic proof, generated and verified through the same external ZisK
runner that produced the feasibility proof.