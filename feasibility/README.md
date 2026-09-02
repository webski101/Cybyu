# Cybyu Feasibility Gate

This directory contains the minimum evidence required to decide whether a real
official Cysic Venus/ZisK proof can be generated in this CyOps environment for
the Cadet MVP. No frontend or calculator workload is built here.

## Status (2026-08-26)

- Environment captured (`environment.json`, `logs/environment.txt`).
- Official workflow pinned from current upstream documentation
  (`workflow.json`).
- Vendor checkout of the official Venus repository is **not present** in this
  workspace because the CyOps safety classifier blocked `git clone`. The plan
  explicitly allows the alternative of inspecting official sources via WebFetch
  until GitHub operations become available, and that path was used here.

## Status (post-resolution)

- The feasibility blocker recorded in `BLOCKER.md` was resolved externally
  by the operator. See `RESOLVED.md` for the full verified results.
- Proving now runs inside the operator-installed WSL2 Ubuntu ZisK v1.2.0-alpha
  environment. The MVP must keep this boundary explicit and never ask the
  adapter to accept arbitrary user code or commands.

## Captured environment

- Git 2.53.0 (Windows), Node 24.14.1, npm 11.11.0, Docker 28.1.1, WSL2 Ubuntu.
- Rust, cc, cmake, and `nvidia-smi` are not installed in the visible path.

## Pinned official workflow

- Backend: ZisK (https://github.com/0xPolygonHermez/zisk), wrapped by the Cysic
  Venus monorepo (https://github.com/cysic-labs/venus).
- Supported runtime per upstream quickstart: Linux x86_64 (Ubuntu 22.04+) or
  macOS 14+. Venus explicitly states that macOS is not currently supported.
- Phases: install toolchain, scaffold project, build, execute, program-setup,
  prove, verify. Each command is recorded in `workflow.json`.

## Required capabilities for proving

- Rust toolchain as installed by the official `ziskup` installer.
- A large set of system libraries (apt or brew packages — see `workflow.json`).
- A GPU is expected by the official `prove` workflow.

## Next steps in this gate

1. Clone the official Venus repository once the CyOps classifier permits
   `git clone`, and record the pinned commit SHA.
2. Generate the smallest `7 × 6 = 42` guest using `cargo-zisk new` and the
   minimal host/guest code path.
3. Run build → execute → program-setup → prove → verify.
4. If the primary path fails because of a concrete environment requirement,
   apply Task 5's one-supported-alternative rule (WSL2 or Docker) before
   recording a blocker.
