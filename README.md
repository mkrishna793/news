# Curiosity Atlas

A light, editorial research workspace built with Next.js, React, Tailwind and shadcn-style components backed by Radix primitives.

## Run

```bash
npm ci
npm run dev -- --hostname 0.0.0.0
```

No credentials are needed to open the app. Without `DATABASE_URL`, an embedded Postgres-compatible PGlite database persists in `.atlas/database` (Git-ignored). For an existing Postgres deployment, set `DATABASE_URL` using `.env.example`. Tables and indexes are created on first use. The embedded store is intended for one local server process; use external Postgres for multi-instance deployments. Do not run production and development servers against the same embedded directory simultaneously.

## The reading workspace

- **Overview:** topic tabs, a paginated lead story, original abstracts, saved reading, conceptual SVG illustrations and project discovery.
- **Appearance:** sage, rose and sand light palettes, persisted in this browser. Dialogs and tabs use Radix/shadcn-style primitives with keyboard navigation; motion respects reduced-motion preferences.
- **Research:** arXiv, PubMed and Hugging Face collectors, including a dedicated Quantum Biology lane. Article pages prioritise the original source text and extracted paper figures. Illustrations are explicitly conceptual, not research results.
- **Quantum Biology:** a dedicated field guide, evidence caveats, source searches and collected papers on radical pairs, photosynthetic coherence and enzyme tunnelling.
- **Project discovery:** `/project-research` accepts a public GitHub repository. It extracts topics from the repository metadata, matches papers in the local library, links to arXiv searches and searches similar GitHub projects. This is metadata-based discovery, not a deep code or mathematical dependency audit. Existing project tracking and repository selection remain under `/projects`.
- **Community:** research-focused community collectors; existing connections support Reddit, Hacker News, Bluesky, Mastodon and RSS. X links open live searches. Automated X ingestion is **not implemented** and requires authorised API access; no fabricated posts are shown.
- **Translation:** an article’s Translate button requests a natural English translation of its title and abstract through the optional configured language model. Originals remain available. Connect a compatible model or local CLI under Settings & connections. Translation requires that connection and is not a substitute for checking the original.

## Updates that tell the truth

Use **Update feed** to collect sources. **Last checked** opens per-source health, including errors and records checked. A completed refresh does not imply there are new publications. Repeated publications are upserted by URL, not duplicated; changed non-empty abstracts replace stale text even when shorter, scores can fall as well as rise, and cached model explanations are invalidated when source text changes.

The refresh lock is acquired before database work. Four background jobs run at a time, with serial rate-limited arXiv/Reddit requests, fetch timeouts, 40-row write batches, a five-connection external pool, bounded GitHub snapshot caching, and date/tag indexes. Saved and read papers are retained during the existing 45-day cleanup. The default collection focuses on research, AI and builders; legacy industry/world/video routes are retained but no longer gathered by default. Custom connected sources still run.

The Node server schedules stale collection on startup and checks every 20 minutes (default freshness interval: three hours). Manual refresh uses Next.js `after` to keep ingestion attached to the request lifecycle. A long-running Node deployment is recommended; short serverless execution limits can interrupt a full collection. The process-local lock does not coordinate multiple server instances.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
# With the development server already running on port 3000:
npm run test:smoke
npm run test:api
```

The browser smoke test covers desktop rendering, theme persistence, topic filtering, quantum biology navigation, invalid repository input, mobile navigation, horizontal overflow and browser exceptions. Test screenshots are written to `.atlas/` and are not committed. Its bundled Chromium launcher is for Linux x64 environments.

This sandbox permits GitHub but restricts many research/social hosts. GitHub discovery was exercised against `pytorch/pytorch`; arXiv, PubMed and other blocked hosts appear as unavailable in source health. In environments using a trusted interception certificate, start Node with `NODE_USE_SYSTEM_CA=1`; do not disable TLS verification.

## Deployment boundary

This remains a personal/local-first application, **not a hardened multi-user service**. Existing connection settings and agent/CLI endpoints assume trusted local access. Add authentication, authorisation, secret management, endpoint restrictions and rate limiting before exposing it publicly. Optional email, AI and GitHub connections remain in the existing settings flow; do not commit secrets.
