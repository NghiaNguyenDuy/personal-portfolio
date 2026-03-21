# Personal Portfolio Platform

A cost-conscious personal portfolio platform built with Next.js App Router and PostgreSQL.

## Included capabilities

- Career profile and featured work
- Blog publishing model and article detail pages
- Daily news summaries by topic with cached source citations
- Admin reading manager for curated external articles and notes
- Auth-gated comment workflow model
- Prisma schema for a managed Postgres deployment

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
