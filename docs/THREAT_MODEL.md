# Tuvyy threat model

## Assets

- QOR held in the EVM `TuvyyGovernor` treasury
- Native cw20 allowances written on the allowlisted WDT contract (ledger)
- Chair ML-DSA-87 key that authorises `execute`

## Adversaries

1. **Q-Day classical attacker** — holds only the chair's secp256k1 / ECDSA key (and any open EVM window).
2. **Malicious member** — can propose and vote, cannot forge the chair's ML-DSA signature.
3. **Relayer** — can submit a valid signed `execute` but cannot alter recipient, amount, or Native beneficiary (bound in the digest).
4. **Bridge misuse** — calling a Native contract outside `bridge_allowed_targets` must fail.

## Guarantees

| Action | Classical ECDSA alone | With ML-DSA-87 |
| --- | --- | --- |
| Propose / vote | Allowed (membership) | n/a |
| Execute payout | **Refused** (`BadPqc`) | Allowed if proposal passed |
| Change Native target | Chair EOA only (operational) | — |
| CrossVM to non-allowlisted target | Reverts on chain | Reverts on chain |

Execute binds: domain, chain id, governor address, proposal id, EVM recipient, Native beneficiary hash, Native target hash, amount, chair nonce. Replay across proposals or chains fails.

## Atomicity

`execute` calls the CrossVM bridge **before** the EVM transfer. If the Native leg reverts or the precompile is inactive (empty reply), the whole transaction reverts and the treasury is untouched.

## Honest limitations (diana testnet)

- Only three Native contracts are on the bridge allowlist. Tuvyy uses WDT cw20 `increase_allowance` as a **verifiable Native ledger**, not a spendable vesting vault (no vesting code is allowlisted).
- `MsgCrossVMCall` and the bridge precompile are testnet-only today.
- Chair rotation of the ML-DSA key on-chain rotates verification via `pqcKeyStatus` automatically; the contract stores no pubkey.

## Q-Day Drill posture

- Keep the drill account's EVM window closed, or scoped only to the governor address with a fee-sized max value.
- Do not approve unlimited ERC-20 spenders from the drill key.
- Prove liveness with one hybrid-signed transaction during the drill day.
