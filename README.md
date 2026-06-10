# FairShare Backend (Boilerplate)

This is a starter backend for a Splitwise-like app using Node.js, Express and PostgreSQL.

Quick start:

1. Copy `.env.example` to `.env` and set your values.
2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

Database schema is in `sql/init.sql` but we now use Prisma ORM.

Prisma setup:

1. Install deps and generate client:

```bash
npm install
npx prisma generate
```

2. Run migrations (development):

```bash
npx prisma migrate dev --name init
```

3. Open Prisma Studio:

```bash
npx prisma studio
```
