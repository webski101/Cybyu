# tryui

**Paste a job, scholarship, or internship offer. Get a shareable go / no-go brief.**

Built for [HackGlobal 2026](https://community.vultr.com/e/hackglobal-2026) — Track 4: Civic and real-world impact.

## What it does

1. Paste offer text (WhatsApp / email / SMS)
2. tryui scores scam patterns, retrieves cited advisories, and writes a decision brief
3. Share a public `/r/<id>` link back into the group chat

Optional: set `OPENAI_API_KEY` to refine summaries with an LLM. Without a key, the rules + citation engine still works (sample-ready for demos).

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Deploy on Vultr Compute (hackathon requirement)

1. Create an Ubuntu Vultr Compute instance and open port `3000` (or put Nginx in front on `80/443`).
2. Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

3. Copy this repo to the instance, then:

```bash
cd tryui
docker compose up -d --build
```

4. Confirm health:

```bash
curl http://YOUR_VULTR_IP:3000/api/health
```

5. Demo URL for submission: `http://YOUR_VULTR_IP:3000`  
   (Prefer a domain + HTTPS if you have one.)

### Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | No | Better narrative summaries |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `DATABASE_URL` | No | Postgres; otherwise embedded PGlite |
| `TRYUI_HOST` | No | Label in `/api/health` (`vultr`) |

Claim your HackGlobal gift-code credits, create the instance, and keep it running through judging.

## Deliverables checklist

- [x] Public GitHub repository with setup docs
- [x] Backend designed for Vultr Compute (`Dockerfile` + `docker-compose.yml`)
- [x] Public demo URL (your Vultr IP / domain)
- [x] Shareable product-style experience (`/` + `/r/[id]`)
- [x] Use-case + system design notes in `docs/SYSTEM.md`

## Stack

Next.js · TypeScript · Tailwind · PGlite/Postgres · optional OpenAI
