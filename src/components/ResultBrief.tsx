"use client";

import type { AnalysisResult } from "@/lib/types";
import { VerdictBadge } from "./VerdictBadge";

export function ResultBrief({
  result,
  shareUrl,
}: {
  result: AnalysisResult;
  shareUrl?: string;
}) {
  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <article className="brief" id="brief">
      <header className="brief-head">
        <VerdictBadge verdict={result.verdict} />
        <p className="brief-score">Risk score {result.score}/100</p>
      </header>

      <h2 className="brief-title">{result.headline}</h2>
      <p className="brief-summary">{result.summary}</p>

      <div className="brief-meta">
        <span>{result.offerType}</span>
        <span>{result.country || "multi-country"}</span>
        <span>{result.engine}</span>
      </div>

      {result.flags.length > 0 && (
        <section className="brief-section">
          <h3>Red flags</h3>
          <ul className="flag-list">
            {result.flags.map((flag) => (
              <li key={flag.id} data-severity={flag.severity}>
                <strong>{flag.title}</strong>
                <span>{flag.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="brief-section">
        <h3>Ask these before you proceed</h3>
        <ol className="question-list">
          {result.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>

      <section className="brief-section">
        <h3>What to do next</h3>
        <ul className="step-list">
          {result.nextSteps.map((step) => (
            <li key={step.label}>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
              {step.url ? (
                <a href={step.url} target="_blank" rel="noreferrer">
                  Open official page
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="brief-section">
        <h3>Cited guidance</h3>
        <ul className="cite-list">
          {result.citations.map((c) => (
            <li key={c.id}>
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.title}
              </a>
              <span>
                {c.source} · {c.country}
              </span>
              <p>{c.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>

      {shareUrl ? (
        <div className="share-row">
          <p>Share this brief in the group chat where the offer appeared.</p>
          <button type="button" className="btn-secondary" onClick={copyLink}>
            Copy share link
          </button>
          <a className="share-url" href={shareUrl}>
            {shareUrl}
          </a>
        </div>
      ) : null}

      <p className="disclaimer">
        tryui is a decision aid, not legal advice. Never treat a low score as a
        guarantee of legitimacy.
      </p>
    </article>
  );
}
