# AI usage — Tuvyy

## Tools

- Cursor Cloud Agent (Composer) for architecture research, Solidity, React UI, Foundry tests, and docs.

## What AI generated

- Cross-VM Hybrid DAO design adapted from fest docs + other-chain winner patterns
- `TuvyyGovernor.sol` (PQ-gated execute + CrossVM bridge call)
- Foundry mocks/tests for precompiles
- Vite/React demo UI (`src/App.tsx`, `src/App.css`)
- `src/lib/crossvm.ts` calldata helpers
- README, threat model, this file

## What humans must do

- Register ML-DSA-87 on diana, open a scoped EVM window
- Deploy with a real key, fund the treasury, run a live execute
- Paste real tx hashes into `docs/PROOF.md`
- Record the Q-Day Drill
- Final 3-minute video and project page on build.qorechain.io

## Review

- Every Solidity path was checked against `@qorechain/evm` `IQORE_PQC_ABI` (pubkey, signature, message order).
- Allowlist limitation for Native vesting is stated honestly in the README and threat model — not hidden.
