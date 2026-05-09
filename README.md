# Personal Portfolio Platform

A cost-conscious personal portfolio platform built with Next.js App Router and PostgreSQL.

## Included capabilities

- Career profile and featured work
- Blog publishing model and article detail pages
- Daily news summaries by topic with cached source citations
- Admin reading manager for curated external articles and notes
- Auth-gated comment workflow model
- Prisma schema for a managed Postgres deployment
- Token-protected admin workflow for importing sources and refreshing news summaries

## Setup

1. Install Node.js 20+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in real values:

```bash
cp .env.example .env.local
```

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed local data:

```bash
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

## Local Postgres with Docker

1. Start the local database:

```bash
docker compose up -d
```

2. Copy the Docker env template:

```bash
cp .env.docker.example .env
```

3. Generate Prisma client, create the schema, and seed demo data:

```bash
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

4. Stop the database when finished:

```bash
docker compose down
```

## Notes

- The repository ships with demo data so the UI has complete flows before a real database and auth provider are attached.
- The `/admin` area currently uses a lightweight placeholder guard pattern and is ready to be connected to your auth provider of choice.
- The news cron route is implemented behind `CRON_SECRET` and service adapters in `lib/services/news.ts`.
- The admin news workflow accepts `POST /api/admin/news-workflow` with `Authorization: Bearer $NEWS_WORKFLOW_TOKEN`. It imports active sources, refreshes tracked topic summaries, and revalidates public/admin news paths.
- Keep `.env.example` placeholder-only. Rotate any real provider keys or admin credentials that were ever copied into local notes or ignored env files before deploying automation.

## Vercel + Neon deployment notes

- Set the Vercel build command to `npm run vercel-build` so Prisma Client is generated, migrations are deployed, and then Next.js builds.
- `DATABASE_URL` should use the Neon pooled connection string for runtime queries.
- `DIRECT_URL` should use the Neon direct connection string for Prisma migrations.
- Do not use local placeholder URLs such as `localhost:5432` in Vercel environment variables.
- After the first deployment, seed production once from a trusted local shell with the Neon direct URL, then redeploy or refresh the app.

## Remote news workflow runner

- Run `npm run automation:news -- --target https://your-vercel-app.vercel.app` to post to the production news workflow endpoint.
- The runner reads `NEWS_WORKFLOW_TOKEN` from the process environment, `.env.local`, `.env`, or `.env.production`, without printing the token.
- The runner refuses `localhost` unless `--allow-local` is passed, so the scheduled automation does not silently post to a local dev server.
- Run `npm run automation:news -- --target https://your-vercel-app.vercel.app --check-config` to validate target/token configuration without posting.
