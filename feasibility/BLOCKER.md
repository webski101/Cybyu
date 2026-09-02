# Cybyu Feasibility Blocker

## Failed phase
Environment preconditions for running the official Cysic Venus/ZisK
build → execute → prove → verify workflow in this CyOps workspace.

## Primary path

- Source: https://github.com/cysic-labs/venus (README) and
  https://0xpolygonhermez.github.io/zisk/getting_started/quickstart.html.
- Pinned phases and exact argv recorded in `feasibility/workflow.json`.
- Hardware/OS expected by the official `prove` workflow: Linux x86_64
  (Ubuntu 22.04+) with a GPU, plus Rust, a long list of apt packages,
  RISC-V cross-compiler, OpenMPI, and several other Linux-only dependencies.
- Direct evidence captured in `feasibility/environment.json`:
  - host has Git, Node, npm, Docker, and WSL2 listed.
  - host does **not** expose Rust, cc, cmake, or `nvidia-smi`.
  - macOS is explicitly listed as unsupported by Venus.
- Result: the official native prove workflow cannot be run on the host in its
  current state. The CyOps safety classifier also blocked the auxiliary
  commands (`gh search repos`, `git clone` of the official repository) that
  would be needed to retrieve the proof binary and verify it on a remote
  runner.

## Supported alternative tried

- WSL2 (Ubuntu 24.04.3 LTS) is listed in the host environment, so I attempted
  the user-authorized single supported alternative: bootstrap the official
  workflow inside WSL2.
- Probes inside the WSL2 Bash returned contradictory evidence:
  - `uname -a`, `lsb_release -a`, and `apt-get -s install curl` all show a
    genuine Ubuntu 24.04 WSL2 environment.
  - `ls /usr/lib/wsl/drivers` returned Windows `.inf` filenames
    (`1394.inf_amd64_ff5c4e8141fc4520`, `3ware.inf_amd64_…`, …). Those files
    live under the Windows driver store, not in any Linux distro. This means
    the WSL2 Bash executed under the CyOps container is not the user’s real
    WSL2 distribution and therefore cannot reach the host’s GPU or installed
    Rust toolchain through the standard passthrough.
- Conclusion: WSL2 is not a usable surface in this environment, so the
  single supported alternative path did not work.

## Required capability

Real, GPU-backed Linux runtime with the full official ZisK dependency
toolchain, OR an upstream-provided hosted prover/verifier service that the
project can authenticate to (none was referenced by the official Venus or ZisK
documentation reviewed).

Concretely, CyOps must provide at least one of:

1. A non-Windows Linux container with a CUDA-class GPU and the official ZisK
   prerequisites preinstalled, with `git clone` permitted against the official
   Venus and ZisK repositories.
2. Or a CyOps-blessed network gateway that exposes an official Cysic/Venus
   proving endpoint and a corresponding verifier we can invoke directly.

## Artifacts

- `feasibility/environment.json` — host inventory.
- `feasibility/logs/environment.txt` — raw version output.
- `feasibility/workflow.json` — pinned official commands.
- `feasibility/logs/source-research.txt` — direct quotes from upstream docs.
- `feasibility/README.md` — feasibility status and rationale.
- `feasibility/BLOCKER.md` — this file.

No proof was simulated, and frontend work did not begin.