import { useEffect, useMemo, useState } from "react";

import "./App.css";
import {
  CROSSVM_BRIDGE,
  WDT_CW20,
  allowancePayload,
  createDemoState,
  encodeBridgeCalldata,
  fetchAllowlist,
  makeClient,
  type DemoProposal,
} from "./lib/crossvm";

type Tab = "bridge" | "propose" | "vote" | "execute" | "status";

const FOOTER =
  "EVM votes. Native ledger. One atomic step. Classical keys move nothing.";

export function App(): JSX.Element {
  const client = useMemo(() => makeClient(), []);
  const [tab, setTab] = useState<Tab>("bridge");
  const [demo, setDemo] = useState(createDemoState);
  const [toast, setToast] = useState<string | null>(null);
  const [desc, setDesc] = useState("Fund Q-Day research sprint");
  const [recipient, setRecipient] = useState(
    "0xB0B0000000000000000000000000000000000B0B",
  );
  const [nativeBen, setNativeBen] = useState(
    "qor1beneficiarydemo000000000000000000000",
  );
  const [amount, setAmount] = useState("0.5");
  const [selected, setSelected] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllowlist(client);
        if (!cancelled) {
          setDemo((d) => ({ ...d, allowlist: list }));
        }
      } catch (err) {
        if (!cancelled) {
          setLiveError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function flash(msg: string) {
    setToast(msg);
  }

  function propose() {
    const id = demo.proposals.length + 1;
    const p: DemoProposal = {
      id,
      description: desc.trim() || "Untitled",
      evmRecipient: recipient.trim(),
      nativeBeneficiary: nativeBen.trim(),
      amountEth: amount,
      yes: 0,
      no: 0,
      deadline: Date.now() + 60_000,
      executed: false,
      canceled: false,
    };
    setDemo((d) => ({
      ...d,
      proposals: [p, ...d.proposals],
    }));
    setSelected(id);
    setTab("vote");
    flash("Proposal created (demo)");
  }

  function vote(id: number, support: boolean) {
    setDemo((d) => ({
      ...d,
      proposals: d.proposals.map((p) =>
        p.id === id && !p.executed && !p.canceled
          ? {
              ...p,
              yes: support ? p.yes + 1 : p.yes,
              no: support ? p.no : p.no + 1,
              // Fast-forward deadline so execute is reachable in demo.
              deadline: Date.now() - 1,
            }
          : p,
      ),
    }));
    flash(support ? "Yes vote cast" : "No vote cast");
    setTab("execute");
  }

  function execute(id: number) {
    const p = demo.proposals.find((x) => x.id === id);
    if (!p || p.executed || p.canceled) return;
    if (p.yes <= p.no) {
      flash("Proposal did not pass");
      return;
    }
    const amt = Number(p.amountEth);
    if (demo.treasuryEth < amt) {
      flash("Treasury too low");
      return;
    }
    const payload = allowancePayload(p.nativeBeneficiary, BigInt(Math.floor(amt * 1e18)));
    const calldata = encodeBridgeCalldata(WDT_CW20, payload);
    setDemo((d) => ({
      ...d,
      treasuryEth: Number((d.treasuryEth - amt).toFixed(6)),
      lastBridgeCalldata: calldata,
      lastNativePayload: JSON.stringify(payload, null, 2),
      proposals: d.proposals.map((x) =>
        x.id === id ? { ...x, executed: true } : x,
      ),
    }));
    flash("Executed: EVM payout + Native CrossVM call");
    setTab("status");
  }

  const open = demo.proposals.filter((p) => !p.executed && !p.canceled);
  const words = FOOTER.split(" ");

  return (
    <div className="shell">
      <header className="brand-row">
        <div>
          <h1 className="brand">
            Tuv<span>yy</span>
          </h1>
          <p className="tag">
            Cross-VM Hybrid DAO — vote on EVM, settle the Native treasury in the
            same atomic step. A leaked ECDSA key cannot execute.
          </p>
        </div>
        <div className="pills">
          <span className="pill on">qorechain-diana</span>
          <span className="pill">Cross-VM</span>
          <span className="pill">ML-DSA-87 execute</span>
          <span className="pill">demo mode</span>
        </div>
      </header>

      <section className="lanes" aria-label="Dual lane architecture">
        <div className="lane">
          <h2>EVM lane</h2>
          <p>Members, proposals, votes, and QOR treasury live in Solidity.</p>
        </div>
        <div className="bridge">
          <span>Atomic</span>
          <div className="pulse" />
          <span>0x…0901</span>
        </div>
        <div className="lane native">
          <h2>Native lane</h2>
          <p>
            Allowlisted WDT cw20 receives <code>increase_allowance</code> as the
            treasury ledger.
          </p>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="label">Treasury</div>
          <div className="value" key={demo.treasuryEth}>
            {demo.treasuryEth} QOR
          </div>
        </div>
        <div className="stat">
          <div className="label">Open proposals</div>
          <div className="value" key={open.length}>
            {open.length}
          </div>
        </div>
        <div className="stat">
          <div className="label">Allowlisted targets</div>
          <div className="value" key={demo.allowlist.length}>
            {demo.allowlist.length}
          </div>
        </div>
      </section>

      <nav className="tabs">
        {(
          [
            ["bridge", "Bridge"],
            ["propose", "Propose"],
            ["vote", "Vote"],
            ["execute", "Execute"],
            ["status", "Status"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "bridge" && (
        <section className="panel">
          <h3>CrossVM bridge</h3>
          <p className="hint">
            Precompile <code>{CROSSVM_BRIDGE}</code> · targetVM 1 (QoreChain
            Native). Only allowlisted contracts can be reached from EVM.
          </p>
          {liveError && (
            <div className="warn">
              Live allowlist read failed ({liveError}). Showing last known
              fallback list.
            </div>
          )}
          <div className="list">
            {demo.allowlist.map((a) => (
              <div className="item" key={a}>
                <h4>{a === WDT_CW20 ? "WDT cw20 (default)" : "Allowlisted"}</h4>
                <p>{a}</p>
              </div>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="btn" onClick={() => setTab("propose")}>
              Start a proposal
            </button>
          </div>
        </section>
      )}

      {tab === "propose" && (
        <section className="panel">
          <h3>New proposal</h3>
          <p className="hint">
            Demo mode — no wallet required. Live deploy uses{" "}
            <code>TuvyyGovernor.sol</code> on diana.
          </p>
          <div className="form">
            <label>
              Description
              <input value={desc} onChange={(e) => setDesc(e.target.value)} />
            </label>
            <label>
              EVM recipient
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>
            <label>
              Native beneficiary (qor1…)
              <input
                value={nativeBen}
                onChange={(e) => setNativeBen(e.target.value)}
              />
            </label>
            <label>
              Amount (QOR)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <div className="actions">
              <button type="button" className="btn" onClick={propose}>
                Create proposal
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === "vote" && (
        <section className="panel">
          <h3>Vote</h3>
          <p className="hint">One member, one vote. Quorum is checked at execute.</p>
          <div className="list">
            {open.length === 0 && <p className="hint">No open proposals.</p>}
            {open.map((p) => (
              <div className="item" key={p.id}>
                <h4>
                  #{p.id} {p.description}
                </h4>
                <p>
                  yes {p.yes} · no {p.no} · {p.amountEth} QOR → {p.evmRecipient}
                </p>
                <div className="actions">
                  <button type="button" className="btn" onClick={() => vote(p.id, true)}>
                    Vote yes
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => vote(p.id, false)}
                  >
                    Vote no
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "execute" && (
        <section className="panel">
          <h3>Execute</h3>
          <p className="hint">
            Live path requires the chair&apos;s ML-DSA-87 signature over the
            execution digest (<code>pqcVerify</code>). Demo skips the signature
            and still shows the CrossVM calldata that would be sent.
          </p>
          <div className="list">
            {demo.proposals
              .filter((p) => !p.executed && !p.canceled && p.deadline < Date.now())
              .map((p) => (
                <div className="item" key={p.id}>
                  <h4>
                    #{p.id} {p.description}
                  </h4>
                  <p>
                    yes {p.yes} · no {p.no} · Native {p.nativeBeneficiary}
                  </p>
                  <div className="actions">
                    <button type="button" className="btn" onClick={() => execute(p.id)}>
                      Execute atomic payout
                    </button>
                  </div>
                </div>
              ))}
            {demo.proposals.every(
              (p) => p.executed || p.canceled || p.deadline >= Date.now(),
            ) && (
              <p className="hint">
                No proposals ready. Vote yes on one to close the demo voting
                window.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "status" && (
        <section className="panel">
          <h3>Status</h3>
          <p className="hint">
            Network <code>{client.network.name}</code> · selected proposal{" "}
            {selected ?? "—"}
          </p>
          {demo.lastNativePayload && (
            <>
              <h4 style={{ fontFamily: "Syne, sans-serif" }}>Native payload</h4>
              <pre className="mono">{demo.lastNativePayload}</pre>
              <h4 style={{ fontFamily: "Syne, sans-serif" }}>
                Bridge calldata ({CROSSVM_BRIDGE})
              </h4>
              <pre className="mono">{demo.lastBridgeCalldata}</pre>
            </>
          )}
          <div className="list" style={{ marginTop: "1rem" }}>
            {demo.proposals.map((p) => (
              <div className={`item${p.executed ? " done" : ""}`} key={p.id}>
                <h4>
                  #{p.id} {p.description}
                </h4>
                <p>
                  {p.executed
                    ? "executed"
                    : p.canceled
                      ? "canceled"
                      : "open"}{" "}
                  · yes {p.yes} / no {p.no}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <p className="words">
          {words.map((w, i) => (
            <span key={`${w}-${i}`} style={{ animationDelay: `${i * 0.05}s` }}>
              {w}
              {i < words.length - 1 ? "\u00a0" : ""}
            </span>
          ))}
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          MIT · Build Before Q-Day ·{" "}
          <a href="https://docs.qorechain.io/sdk/guides/cross-vm/">
            Cross-VM docs
          </a>
        </p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
