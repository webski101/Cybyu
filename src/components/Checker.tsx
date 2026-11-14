"use client";

import { useState, useTransition } from "react";
import type { AnalysisResult } from "@/lib/types";
import { ResultBrief } from "./ResultBrief";

const SAMPLES = {
  scam: `URGENT hiring!!! Remote Data Entry role paying $850/day.
No interview needed. Message me on WhatsApp only.
To activate your staff portal pay a $49 registration fee in USDT today
or your slot will be blocked. Send OTP if the bank asks.`,
  caution: `Hi, I saw your profile and we may have an internship opening
at NovaGrid. Can we continue on Telegram for now?
The stipend is solid. Company email coming later this week.`,
  clean: `Thank you for interviewing with Lakeside Health.
Our official offer for the Graduate Nurse role is attached on the
careers portal at careers.lakesidehealth.example.
Please review benefits and reply from your email within 7 days.
No payment is required at any stage.`,
};

export function Checker() {
  const [text, setText] = useState("");
  const [country, setCountry] = useState("NG");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pending, startTransition] = useTransition();

  function runAnalyze(value: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value, countryHint: country }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not analyze that offer.");
          setResult(null);
          return;
        }
        setResult(data.result as AnalysisResult);
        requestAnimationFrame(() => {
          document.getElementById("brief")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } catch {
        setError("Network error — is the tryui server running?");
      }
    });
  }

  return (
    <div className="checker">
      <div className="composer">
        <label className="field-label" htmlFor="offer">
          Paste the job, scholarship, or internship message
        </label>
        <textarea
          id="offer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste WhatsApp text, email, or SMS here…"
          rows={8}
        />

        <div className="composer-row">
          <label className="country-field">
            Your country
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="NG">Nigeria</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="GLOBAL">Other</option>
            </select>
          </label>

          <div className="sample-row">
            <button
              type="button"
              className="chip"
              onClick={() => setText(SAMPLES.scam)}
            >
              Sample scam
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setText(SAMPLES.caution)}
            >
              Sample caution
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setText(SAMPLES.clean)}
            >
              Sample clean
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={pending || text.trim().length < 12}
          onClick={() => runAnalyze(text)}
        >
          {pending ? "Reading the offer…" : "Get go / no-go brief"}
        </button>

        {error ? <p className="error">{error}</p> : null}
      </div>

      {result ? (
        <ResultBrief
          result={result}
          shareUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/r/${result.id}`
              : `/r/${result.id}`
          }
        />
      ) : null}
    </div>
  );
}
