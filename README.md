# PlateForward v2

A DBMS mini-project for listing surplus food, claiming donations, tracking pickup/delivery, expiry, statistics, and audit events.

## Stack
- HTML, CSS, vanilla JavaScript
- Vercel serverless API routes
- Neon PostgreSQL via `@neondatabase/serverless`

## Deploy on GitHub + Vercel
1. Create a Neon project at https://neon.tech and copy its PostgreSQL connection string.
2. In Neon SQL Editor, run `schema.sql`.
3. Create a GitHub repository and upload all files in this folder (including the `api` and `public` folders).
4. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy.
5. In Vercel **Project → Settings → Environment Variables**, add `DATABASE_URL` with the Neon connection string for Production, Preview, and Development.
6. Redeploy after adding the environment variable.
7. Open the deployed URL and test creating a donation, claiming it, pickup, delivery, CSV export and dark mode.

## Important
- Do not commit `.env` or share your database connection string publicly.
- `schema.sql` creates the required tables and inserts a couple of demo records only when the donations table is empty.
- This is a classroom demonstration app. Before real public use, add authentication/roles so visitors cannot impersonate donors or volunteers, plus food-safety and privacy controls.
