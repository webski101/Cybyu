# Cybyu Prove-Page Explanation Design

## Scope

Update presentation markup only in `app/prove/page.tsx`. Do not change backend logic, runner behavior, API routes, proof storage, workloads, hashes, verification behavior, buttons, forms, routes, or stage behavior.

## Approved Design

Expand the existing blue-accent explanatory callout above the workload cards.

The callout contains:

1. Heading: **Valid proof does not mean correct software.**
2. Two compact, scan-friendly rows:
   - **Correct Calculator** → green **Tests PASS** + green **Execution proof VALID**
   - **Buggy Calculator** → red **Tests FAIL** + green **Execution proof VALID**
3. Supporting sentence: **Cybyu proves what actually executed and what result it produced. It does not claim that the program itself is correct.**
4. Existing preserved-proof explanation retained beneath the supporting sentence in subdued text.

## Visual Treatment

Reuse the existing dark Cybyu palette and accent-callout container. Use green for PASS and VALID, red for FAIL, and neutral text for workload labels and separators. Rows stack on narrow screens and remain easy to scan. No new section, component abstraction, animation, or broad layout change is introduced.

## Verification

Run `npx tsc --noEmit` and `npm run build`. Confirm only `app/prove/page.tsx` is intentionally changed for this request.