# Production Database Setup

## Recommendation

Use PostgreSQL for launch.

Slushi Squad already uses Prisma with a relational schema. PostgreSQL fits the app well because orders, order items, payments, customers, addresses, flavors, add-ons, and admin settings all relate to each other. MongoDB could work later, but it would require reworking the schema and data access without helping the first neighborhood launch much.

Recommended providers:

- Neon PostgreSQL
- Supabase PostgreSQL
- Vercel Postgres
- Railway PostgreSQL

## Production Steps

1. Create a PostgreSQL project with your provider.
2. Copy the production connection string.
3. Set `DATABASE_URL` in Vercel or your hosting environment.
4. Set the rest of production environment variables.
5. Run production readiness check locally with production-like values.

```bash
npm run prod:check
```

6. Deploy existing migrations.

```bash
npm run prod:migrate
```

7. Seed production only after reviewing defaults.

```bash
npm run prisma:seed
```

## Required Production Environment Variables

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ENABLE_ADULT_BOOSTERS=false`

## Payment Variables Needed Before Live Card Payments

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Manual Venmo, Cash App, and cash can still be used before Stripe is live, as long as admins manually verify and mark payment paid.

## Safety Notes

- Keep `ENABLE_ADULT_BOOSTERS=false` for launch.
- Use a long random `ADMIN_SESSION_SECRET`.
- Use `ADMIN_PASSWORD_HASH`, not a plain password.
- Confirm allowed streets before opening ordering to neighbors.
- Run a demo day before production launch.
