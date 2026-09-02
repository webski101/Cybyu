# Cybyu Prove-Page Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the core distinction between software correctness and execution-proof validity immediately scannable on `/prove`.

**Architecture:** Expand only the existing explanatory `<aside>` in `app/prove/page.tsx`. Preserve all workload definitions, forms, buttons, routes, stages, and backend behavior. Verify the presentation-only change through TypeScript and the production build.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS.

---

## File Structure

- Modify: `app/prove/page.tsx` — replace the existing explanatory aside contents with the approved heading, outcome rows, supporting sentence, and preserved-proof note.
- No other production file changes.

### Task 1: Expand the existing explanatory callout

**Files:**
- Modify: `app/prove/page.tsx:45-49`

- [ ] **Step 1: Confirm the current callout copy**

Read `app/prove/page.tsx` and confirm the existing `<aside>` begins with:

```tsx
<aside className="rounded-xl border border-accent-500/25 bg-accent-500/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
```

Expected: exactly one matching explanatory callout immediately before the workload `<ul>`.

- [ ] **Step 2: Replace only the callout contents**

Keep the existing `<aside>` container and replace its children with:

```tsx
<div className="flex flex-col gap-3">
  <h2 className="font-semibold text-slate-100">
    Valid proof does not mean correct software.
  </h2>
  <div className="grid gap-2 sm:grid-cols-2">
    <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2">
      <p className="font-semibold text-slate-200">Correct Calculator</p>
      <p className="mt-1 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wider">
        <span className="text-good">Tests PASS</span>
        <span className="text-slate-600">+</span>
        <span className="text-good">Execution proof VALID</span>
      </p>
    </div>
    <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2">
      <p className="font-semibold text-slate-200">Buggy Calculator</p>
      <p className="mt-1 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wider">
        <span className="text-bad">Tests FAIL</span>
        <span className="text-slate-600">+</span>
        <span className="text-good">Execution proof VALID</span>
      </p>
    </div>
  </div>
  <p>
    Cybyu proves what actually executed and what result it produced. It does
    not claim that the program itself is correct.
  </p>
  <p className="text-xs text-slate-500">
    This demo executes the selected workload, loads its preserved authentic
    ZisK proof, and re-verifies that proof live. It does not generate a new
    proof on every click.
  </p>
</div>
```

Do not alter any markup outside this `<aside>`.

- [ ] **Step 3: Run TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: `Compiled successfully`, all existing routes remain present, and `/prove` is generated successfully.

- [ ] **Step 5: Inspect the focused diff**

Run:

```bash
git diff -- app/prove/page.tsx
```

Expected: only the existing explanatory aside changed. Workload data, form actions, button labels, and stages are unchanged.

## Plan Self-Review

- The exact requested heading and supporting sentence are included.
- Correct PASS/VALID and buggy FAIL/VALID outcomes are visually distinct.
- Existing preserved-proof explanation remains present.
- Only `app/prove/page.tsx` production markup changes.
- No backend, runner, API, proof, workload, hash, or verification behavior changes.
