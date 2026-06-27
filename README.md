# Slushi Squad

Cold cups. Big dreams. Made in the neighborhood.

Slushi Squad is a mobile-first full-stack ordering app for a neighborhood slushy stand run by a young entrepreneur. Customers build a slushy order, choose pickup or neighborhood delivery, pay with Stripe Apple Pay/card or manual payment methods, and track order status. Admins manage orders, payments, flavors, add-ons, prices, and allowed streets from a phone-friendly dashboard.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Stripe Checkout for Apple Pay/card
- Cookie-based admin authentication
- Vitest

## Features

- Customer order flow: welcome, flavor, size, toppings/add-ons, address, pickup/delivery, payment, review, submit, confirmation
- Neighborhood-only checkout with normalized street matching
- Admin dashboard with order search/filtering, status updates, cancellation, manual payment marking, daily sales, popular flavors, unpaid orders
- Flavor and add-on availability controls
- Allowed street add/remove controls
- Payment methods: Apple Pay/card via Stripe, Venmo, Cash App, cash
- Adult booster compliance gate disabled by default with `ENABLE_ADULT_BOOSTERS=false`

## Adult Booster Compliance

Adult booster add-ons are hidden unless `ENABLE_ADULT_BOOSTERS=true`.

If enabled later, the code requires:

- Customer 21+ confirmation
- ID verification status
- Manual adult admin approval before accepting status progression
- No completion until ID verification is `VERIFIED`
- No Stripe alcohol payment processing unless compliance gates are satisfied

Disclaimer shown when enabled:

> Adult add-ons are only available where legally permitted and require valid ID verification.

Keep `ENABLE_ADULT_BOOSTERS=false` unless you have confirmed local laws, licensing, delivery restrictions, and payment processor rules.

## Local Setup

Fastest local path uses Docker Compose for PostgreSQL.

1. Install dependencies:

```bash
npm install
```

2. Create local environment values:

```bash
cp .env.local.example .env
```

A local `.env` has already been created on this machine with safe development defaults.

3. Start PostgreSQL, migrate, and seed:

```bash
npm run db:setup
```

4. Start the app:

```bash
npm run dev:local
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run db:up       # start local PostgreSQL on port 5433
npm run db:wait     # wait until Docker PostgreSQL is ready
npm run db:down     # stop local PostgreSQL
npm test            # run unit tests
npm run build       # production build check
```

## Environment Variables

See [.env.example](/Users/joshuacovington/Desktop/Git/Slushi Squad/.env.example) and [.env.local.example](/Users/joshuacovington/Desktop/Git/Slushi Squad/.env.local.example).

Important production values:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PASSWORD_HASH` (recommended for production)
- `ADMIN_SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ENABLE_ADULT_BOOSTERS=false`

## Admin Account

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` for local development. For production, set `ADMIN_PASSWORD_HASH` instead of a plain password. The login system supports signed expiring sessions and PBKDF2 password hashes.

Default local credentials:

- Email: `admin@slushisquad.local`
- Password: `change-me`

Change these before deployment.

## Stripe Setup

1. Create a Stripe account and enable Apple Pay/card payment methods.
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. In Stripe Dashboard, create a webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

4. Subscribe to `checkout.session.completed`.
5. Add the signing secret to `STRIPE_WEBHOOK_SECRET`.

Manual Venmo, Cash App, and cash payments intentionally stay `PENDING` until an admin marks them paid. Confirmation pages now show payment-specific instructions and explain that manual payments require admin review.

## Neighborhood Ordering

Allowed streets are stored in `AdminSetting` under `ALLOWED_STREETS` and editable in the admin dashboard.

Street names are normalized so examples like these match:

- `Main St`
- `Main Street`
- `main street`

Blocked checkout message:

```text
Sorry, Slushi Squad is only delivering in our neighborhood right now.
```

## Demo Day

Seed practice orders for a family/neighborhood demo:

```bash
npm run demo:seed
```

Clean them up afterward:

```bash
npm run demo:reset
```

Runbook: [docs/launch/demo-day-runbook.md](/Users/joshuacovington/Desktop/Git/Slushi Squad/docs/launch/demo-day-runbook.md)

## Production Database

Use PostgreSQL for launch. The current Prisma schema is relational and already built for PostgreSQL. MongoDB would require a rewrite and does not add useful launch value right now.

Production setup guide: [docs/production/database-setup.md](/Users/joshuacovington/Desktop/Git/Slushi Squad/docs/production/database-setup.md)

Check production readiness:

```bash
npm run prod:check
```

Apply production migrations:

```bash
npm run prod:migrate
```

## Tests

```bash
npm test
```

Current tests cover:

- Allowed and blocked address matching
- Street suffix/casing normalization
- Adult booster default-disabled compliance behavior
- Checkout form validation
- Manual payment instruction copy
- Admin order status progression
- Admin completion safety checks
- Admin password hash verification
- Production readiness checks

## Vercel Deployment

1. Push the repository to GitHub.
2. Create a Vercel project from the repo.
3. Provision PostgreSQL with Vercel Postgres, Neon, Supabase, or another managed PostgreSQL provider.
4. Add all environment variables in Vercel project settings.
5. Run Prisma migration against production:

```bash
npx prisma migrate deploy
```

6. Seed production only after editing defaults:

```bash
npx prisma db seed
```

7. Configure the Stripe webhook to point to the Vercel production URL.

## Security Checklist

- Use a long random `ADMIN_SESSION_SECRET`.
- Change `ADMIN_PASSWORD`.
- Keep `ENABLE_ADULT_BOOSTERS=false` unless fully compliant.
- Use HTTPS in production.
- Restrict Stripe webhook to signed events.
- Keep manual payments pending until verified by admin.
- Review allowed streets regularly.
- Do not expose `.env` files.
- Use `ADMIN_PASSWORD_HASH` instead of plain `ADMIN_PASSWORD` in production.
- Consider persistent rate limiting with Redis for high traffic.

## Mobile Testing Checklist

- Place an allowed-street delivery order on a small phone viewport.
- Try a blocked street and confirm the friendly message appears.
- Submit Venmo/Cash App/cash orders and confirm payment stays pending.
- Mark manual payment as paid in admin.
- Update order statuses through Complete.
- Toggle flavor and add-on availability.
- Add/remove allowed streets.
- Verify admin search and status filters.
- Test Stripe checkout in test mode.
