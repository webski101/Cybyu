# tryui system design

## Problem

Students receive fake job, scholarship, and internship offers on WhatsApp and email. They need a **fast decision artifact** they can share — not a long chatbot transcript.

## Product loop

```
message paste → risk brief → share link → group chat
```

## Architecture

```
Browser
  └─ Next.js UI (/)
       └─ POST /api/analyze
            ├─ rules engine (pattern flags + score → go/caution/no-go)
            ├─ citation retriever (curated advisories corpus)
            ├─ optional OpenAI refine (OPENAI_API_KEY)
            └─ persist result → GET /r/:id share page
```

All of the above runs as one Node process on a **Vultr Compute** instance (Docker).

## Why this wins against HackGlobal criteria

- **Merit:** Narrow, demoable, real student pain; clear verdict UX
- **Reach:** Share cards are the growth loop; country selector + reporting links support 3+ countries
- **Deployed on Vultr:** hard requirement satisfied via Compose on Compute

## Data

Results store: `results` table (`migrations/001_results.sql`).

- With `DATABASE_URL`: Postgres
- Without: embedded PGlite for local / single-VM demos

## Safety posture

- Never labels an offer “safe” — lowest tier is **Go (with checks)**
- Citations are guidance themes with official links; not legal advice
- No account required; no collection of passwords/OTPs beyond the pasted text the user chooses to submit
