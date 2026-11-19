# Tuvyy

**Cross-VM Hybrid DAO on QoreChain** — for [Build Before Q-Day](https://build.qorechain.io/), Cross-VM track.

Vote and hold the treasury on **EVM**. When a proposal executes, Tuvyy pays the EVM beneficiary and, in the **same atomic transaction**, calls an allowlisted **QoreChain Native** contract through the CrossVM bridge precompile (`0x…0901`). Execution requires an **ML-DSA-87** signature checked on-chain with `pqcVerify`, so a leaked classical ECDSA key alone cannot release funds.

```
EVM (propose / vote / treasury)  ──atomic──►  Native WDT cw20 (increase_allowance ledger)
                     CrossVM 0x…0901
```

## Why this, not another escrow

Existing Cross-VM entries skew to escrow and vesting. Tuvyy is a **DAO**: membership, proposals, quorum, and post-quantum-gated execution that spans both lanes — matching the fest’s “hybrid DAO” example and what atomic cross-chain winners look like at ETHGlobal Cosmos hacks.

## Demo

```sh
pnpm install
pnpm dev          # http://localhost:5173 — demo mode, no wallet
pnpm test         # Foundry + Node smoke
pnpm build
```

Demo mode walks propose → vote → execute and shows the exact Native JSON payload and bridge calldata. Live deploy needs QoreX, an ML-DSA-87 key, a scoped EVM window, and test QOR from the [faucet](https://dashboard.qorechain.io/faucet).

## Contracts

| Piece | Role |
| --- | --- |
| `contracts/TuvyyGovernor.sol` | EVM DAO + atomic CrossVM execute + PQ gate |
| `contracts/mocks/MockPrecompiles.sol` | Foundry stand-ins for `0x…0901` / `0x…0a01` / `0x…0a02` |
| `test/TuvyyGovernor.t.sol` | 7 tests (pass, PQ fail, empty bridge, classical bypass) |

```sh
export PATH="$HOME/.foundry/bin:$PATH"
forge test -vv
```

### Live deploy (diana)

```sh
# After registering ML-DSA-87 and opening a scoped EVM window to the deployer:
forge create contracts/TuvyyGovernor.sol:TuvyyGovernor \
  --rpc-url https://evm-testnet.qore.host \
  --private-key $DEPLOYER_PK \
  --constructor-args $CHAIR_ADDRESS 86400 1
```

Fund the governor with test QOR (`cast send <governor> --value 1ether ...`). Set `VITE_TUVYY_GOVERNOR` in `.env`. Record addresses and tx hashes in `docs/PROOF.md`.

### Native target

Default: allowlisted WDT cw20  
`qor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s93uuqt`

On execute, Tuvyy sends:

```json
{"increase_allowance":{"spender":"<nativeBeneficiary>","amount":"<wei>"}}
```

**Honest limitation:** no vesting/DAO Wasm code is on the bridge allowlist today. The Native leg is a verifiable ledger under the governor’s mapped address (same pattern proven by other diana Cross-VM builds). Schedule and spending policy are enforced on EVM; the Native call still proves a working EVM→Native atomic path to an approved contract.

## Kits

- `create-qorechain-dapp` 0.14 · fullstack-web
- `@qorechain/sdk` 0.14 · `createClient`, `createCrossVMClient`, `getCrossVmParams`
- `@qorechain/evm` 0.14 · PQC + CrossVM precompile addresses / ABI
- CrossVM bridge `0x0000000000000000000000000000000000000901`
- PQC `pqcVerify` `0x…0a01`, `pqcKeyStatus` `0x…0a02`

## Network

| | |
| --- | --- |
| Chain | `qorechain-diana` (testnet) |
| EVM id | `9800` |
| REST | `https://api-testnet.qore.host` |
| EVM RPC | `https://evm-testnet.qore.host` |
| Explorer | https://explore.qore.network (Testnet) |

## Docs in this repo

- [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) — Q-Day attacker, atomicity, drill posture
- [`docs/PROOF.md`](docs/PROOF.md) — fill with live tx hashes after deploy
- [`AI_USAGE.md`](AI_USAGE.md) — for Best AI-Native award

## Licence

MIT — see [LICENSE](LICENSE).
