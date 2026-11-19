# Tuvyy proofs

Fill this after a live diana deploy. Do not invent hashes.

## Local (done)

| Check | Result |
| --- | --- |
| `forge test` | 7/7 passed (2026-11-19) |
| `pnpm build` | `pnpm build` OK (2026-11-19) |
| Demo UI | propose → vote → execute shows bridge calldata |

## Live diana (fill in)

| Item | Value |
| --- | --- |
| Deployer EVM | |
| Deployer Native `qor1…` | |
| ML-DSA registration tx | |
| EVM window tx | |
| `TuvyyGovernor` address | |
| Deploy tx | |
| Fund treasury tx | |
| Propose tx | |
| Vote tx | |
| Execute tx (atomic CrossVM + payout) | |
| Native target | `qor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s93uuqt` |
| Q-Day Drill account | |
| Drill proof tx (18 Nov window) | |

## Allowlist read

```
GET https://api-testnet.qore.host/qorechain/crossvm/v1/params
```

Record `bridge_allowed_targets` and the date of the read here when submitting.
