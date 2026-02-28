# CODEX SKILL — Personal Portfolio on Cloudflare (Astro + D1 + Comments + RSS Digest)

## 0) Goal
Build and deploy a personal portfolio that includes:
- Career profile (About/CV/Experience/Projects)
- Writing blog (career + experiments)
- Practice guides (playbooks)
- Daily Brief (RSS-based daily summaries)
- Reader interactivity (comments, reactions)
- Own database (Cloudflare D1) + safe access patterns

Deployment target: Cloudflare Pages (static + Pages Functions), plus an optional Cloudflare Worker for scheduled RSS ingestion.

---

## 1) Tech stack (minimal but scalable)
### Frontend
- Astro + MDX for content
- Content stored in repo: `src/content/*`

### Database
- Cloudflare D1 (SQLite semantics) for dynamic features:
  - comments, reactions, view counts (optional)
  - rss_sources, rss_items, daily_digest

### Backend (serverless)
- Cloudflare Pages Functions for HTTP APIs (comments, read digest, etc.)
- Cloudflare Worker + Cron Triggers for scheduled ingestion (Daily Brief generation)

Why Worker for schedules:
- Pages Functions do NOT support cron/scheduled handlers; use Workers Cron Triggers.

---

## 2) Repository layout (required)
my-portfolio/
  src/
    content/
      config.ts
      writing/
      guides/
      projects/
      digests/          # optional: static digests; otherwise keep digests in D1
    pages/
      index.astro
      about.astro
      experience.astro
      projects.astro
      writing.astro
      guides.astro
      daily-brief.astro
      tags/[tag].astro
      categories/[category].astro
      writing/[...slug].astro
      guides/[...slug].astro
      projects/[...slug].astro
    components/
      Comments.astro
      CommentList.astro
      CommentForm.astro
      TagFilter.astro
  functions/
    api/
      comments/
        index.ts         # GET list, POST create
      reactions/
        index.ts         # POST toggle reaction
      digest/
        [date].ts        # GET daily digest by date
  worker/
    rss_ingest.ts        # scheduled Worker: fetch RSS, write to D1
  migrations/
    0001_init.sql
  wrangler.toml
  astro.config.mjs
  package.json

---

## 3) Cloudflare Pages deployment settings (must match)
In Cloudflare Pages project settings:
- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`

---

## 4) Database design (D1) — minimal schema
### 4.1 migrations/0001_init.sql
-- Content taxonomy tables (optional, can stay in MDX frontmatter)
-- Dynamic feature tables (required)

-- Users: for simplest version, comments can be anonymous with a "display_name"
-- OR integrate auth later (Cloudflare Access, OAuth, etc.)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  page_path TEXT NOT NULL,         -- e.g. "/writing/my-post"
  parent_id TEXT,                  -- null = top-level
  display_name TEXT NOT NULL,
  body_md TEXT NOT NULL,
  created_at TEXT NOT NULL,        -- ISO timestamp
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_page_path ON comments(page_path);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  page_path TEXT NOT NULL,
  reaction TEXT NOT NULL,          -- e.g. "like"
  actor_hash TEXT NOT NULL,        -- hashed identifier (cookie-based for MVP)
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_reactions_unique
ON reactions(page_path, reaction, actor_hash);

-- RSS sources
CREATE TABLE IF NOT EXISTS rss_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  category TEXT,                   -- e.g. "platform", "mlops", "de"
  created_at TEXT NOT NULL
);

-- RSS items cache
CREATE TABLE IF NOT EXISTS rss_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,               -- ISO date/time if available
  summary TEXT,
  hash TEXT NOT NULL,              -- dedup
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_rss_items_hash ON rss_items(hash);

-- Daily digest
CREATE TABLE IF NOT EXISTS daily_digest (
  day TEXT PRIMARY KEY,            -- "YYYY-MM-DD"
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  sources_json TEXT NOT NULL,      -- JSON array of URLs
  created_at TEXT NOT NULL
);

---

## 5) Wrangler + bindings (Pages + Worker share the same D1)
### 5.1 wrangler.toml (single source of truth)
name = "my-portfolio"
compatibility_date = "2026-02-28"

# For Pages Functions D1 binding:
[[d1_databases]]
binding = "DB"
database_name = "portfolio_db"
database_id = "<CLOUDFLARE_D1_DATABASE_ID>"

# Migrations live here by default
migrations_dir = "migrations"

# Worker Cron (RSS ingestion)
[triggers]
crons = ["15 0 * * *"]  # 00:15 UTC (~07:15 Asia/Ho_Chi_Minh)

### 5.2 D1 commands (run locally)
- Create DB:
  npx wrangler d1 create portfolio_db
- Apply migrations:
  npx wrangler d1 migrations apply portfolio_db --remote

---

## 6) Pages Functions APIs (comments + digest)
### 6.1 /functions/api/comments/index.ts
Responsibilities:
- GET /api/comments?page_path=...
  - return nested threads (or flat + parent_id)
- POST /api/comments
  - body: { page_path, parent_id?, display_name, body_md }
  - validate length, basic spam checks
  - write to D1

Security MVP:
- Rate limit by IP (soft limit) + cooldown:
  - store last_post_time in KV (optional) OR enforce simple checks
- For MVP, no auth required. Later, add auth and store user_id.

### 6.2 /functions/api/reactions/index.ts
- POST /api/reactions { page_path, reaction }
- actor_hash: derive from cookie; if absent, generate and set cookie
- toggle: if exists delete else insert

### 6.3 /functions/api/digest/[date].ts
- GET /api/digest/2026-02-28
- read from daily_digest table
- return body_md + sources_json

---

## 7) RSS ingestion (scheduled Worker)
Because Pages Functions cannot run on schedules, use a Worker with `scheduled()`.

### 7.1 /worker/rss_ingest.ts
Worker logic:
1) Read enabled rss_sources from D1
2) Fetch each feed (RSS or Atom)
3) Parse top N items
4) Upsert into rss_items using hash(title+url+published_at)
5) Generate daily_digest for day=YYYY-MM-DD (UTC)
   - title: "Daily Brief — YYYY-MM-DD"
   - body_md: grouped by category or source
   - sources_json: unique URLs
6) Write daily_digest (overwrite if exists, or skip if already exists)

Parsing:
- Keep minimal dependencies: implement basic RSS/Atom parsing manually
- If using a small library, ensure it runs on Workers runtime.

Testing:
- Use wrangler scheduled test:
  npx wrangler dev --test-scheduled
  Then hit /__scheduled to run.

---

## 8) Content model (Information Architecture)
### 8.1 Top-level nav
- Home
- About
- Experience
- Projects
- Writing
- Practice Guides
- Daily Brief
- Now (optional)

### 8.2 Content collections (Astro `src/content/*`)
- writing: long-form posts (career, experiments, research notes)
- guides: step-by-step playbooks
- projects: case studies (problem → approach → impact → stack)
- digests: optional static archive; primary source is D1 daily_digest

### 8.3 Taxonomy rules (must enforce)
- category: small, stable set (use as primary grouping)
  - data-engineering
  - lakehouse
  - mlops
  - analytics
  - career
  - research
- tags: specific technologies (can grow)
  - databricks, spark, delta-lake, unity-catalog, airflow, dbt, fabric, azure, aws, terraform
- series (optional): structured multi-part learning
  - spark-performance, databricks-governance, etl-patterns

### 8.4 Frontmatter schema (example)
writing/*.mdx
---
title: "..."
date: 2026-02-28
category: "data-engineering"
tags: ["spark", "databricks"]
series: "spark-performance"   # optional
draft: false
description: "..."
---

guides/*.mdx
---
title: "..."
date: 2026-02-28
category: "lakehouse"
tags: ["delta-lake", "unity-catalog"]
level: "beginner" | "intermediate" | "advanced"
time_minutes: 45
draft: false
---

projects/*.mdx
---
title: "..."
date: 2026-02-28
category: "mlops"
tags: ["mlflow", "onnx", "cloudflare"]
impact: "Cut runtime from X to Y; reduced cost by Z%"
stack: ["Astro", "Cloudflare", "D1"]
draft: false
---

### 8.5 Pages and routing requirements
- /writing (filter by category/tag/series)
- /guides (filter by level + tag)
- /projects (filter by stack + impact keywords)
- /daily-brief (show latest digest + archive list)
- /categories/{category}
- /tags/{tag}
- /series/{series} (optional)

---

## 9) “Best RSS feed list” for Data Engineering / Lakehouse / MLOps
Store these in `rss_sources` table (name, feed_url, category). Suggested starter set:

### Platform / release notes
- Databricks release notes RSS (see docs page with RSS icon; capture the feed URL from there)
- AWS Big Data Blog feed:
  - https://aws.amazon.com/blogs/big-data/feed/
  - (alternate recentPosts rss: http://blogs.aws.amazon.com/bigdata/blog/feed/recentPosts.rss)
- Microsoft Azure Updates RSS (if available in your region):
  - https://www.microsoft.com/releasecommunications/api/v2/azure/rss

### Open lakehouse ecosystem
- Delta Lake blog RSS:
  - https://delta.io/rss.xml

### Orchestration / pipelines
- Apache Airflow blog Atom:
  - https://airflow.apache.org/blog/index.xml

### Optional (if you use Fabric heavily)
- Fabric blog’s official feed availability varies; verify working feed endpoints periodically.
  - If official RSS breaks, fall back to FiveFilters-generated feeds (less stable).

Policy:
- Keep 10–25 sources max.
- Prefer official feeds for release notes.
- Add 2–3 community feeds only if they’re consistently high-signal.

---

## 10) Acceptance criteria (Definition of Done)
### Deployment
- Cloudflare Pages builds successfully with `npm run build` → `dist`.
- Pages Functions endpoints available:
  - GET/POST comments
  - POST reactions
  - GET digest by date
- D1 database created + migrations applied.

### Functionality
- Comments render under each post page; supports replies (parent_id).
- Reactions toggle works; counts display.
- Daily Brief page shows latest digest from D1 and an archive list.
- Worker cron job runs daily and writes daily_digest.

### Quality
- Basic input validation (length limits, sanitization for MD rendering)
- Spam mitigation MVP (cooldown + simple heuristics)
- Clear docs: env vars, setup commands, deploy steps.

---

## 11) Codex agent operating instructions (how to work)
When implementing:
1) Never add a full backend server.
2) Keep content in MDX; use DB only for interactive + feed cache.
3) Prefer Cloudflare-native features: Pages Functions + D1 + Worker Cron.
4) Each feature must include:
   - function endpoint
   - DB migration (if needed)
   - UI component integration
   - minimal docs update

Deliver changes as one consolidated code output (no partial diffs).

END.