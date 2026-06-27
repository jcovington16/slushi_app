# Slushi Squad 2-Week Launch Plan

**Slogan:** Cold cups. Big dreams. Made in the neighborhood.

## Goal

Make Slushi Squad reliable enough for neighborhood families to place orders from a phone, while giving the admin a simple way to manage orders, payments, flavors, add-ons, prices, and allowed streets.

## Week 1: Make It Locally Reliable

### Day 1: Local Setup Cleanup

- Add a real local environment setup.
- Make README commands simple and accurate.
- Add a local development command.
- Confirm the app can run from `Desktop/Git/Slushi Squad`.
- Document admin login credentials for local testing.

**Status:** Done.

### Day 2: Database Setup

- Add Docker Compose for PostgreSQL.
- Add repeatable database setup scripts.
- Add a database readiness check.
- Run migrations and seed data automatically.
- Keep local setup independent from Homebrew PostgreSQL.

**Status:** Done.

### Day 3: Checkout Hardening

- Improve required-field validation.
- Improve manual payment instructions.
- Keep Venmo, Cash App, and cash orders pending until admin review.
- Gracefully handle Stripe checkout startup failures.
- Add checkout and payment-copy tests.
- Smoke test allowed and blocked addresses.

**Status:** Done.

### Day 4: Admin Dashboard Polish

- Improve mobile layout for order cards.
- Replace prompt-based price edits with proper forms.
- Add confirmation prompts for canceling orders.
- Add confirmation prompts for marking orders paid.
- Make unpaid orders easier to scan.
- Improve visual labels for order status and payment status.

**Status:** Done.

### Day 5: Admin Authentication And Security

- Replace simple environment-password login with hashed admin users.
- Add password hashing with bcrypt or Argon2.
- Add session expiration and safer auth helpers.
- Add login/logout tests.
- Add admin route protection tests.

**Status:** Done.

### Day 6: QA Pass

- Test the full customer order flow on mobile.
- Test blocked street checkout.
- Test pickup and delivery orders.
- Test all manual payment options.
- Test Stripe test-mode checkout.
- Test admin status updates.
- Test flavor and add-on availability toggles.
- Test allowed street add/remove.

**Status:** Done.

### Day 7: Family And Neighborhood Demo

- Run a fake-order demo day.
- Let family test the customer flow.
- Let the admin test managing orders from a phone.
- Collect feedback on copy, prices, flavors, and pickup/delivery rules.
- Decide real launch hours and delivery boundaries.

**Status:** Done.

**Artifacts:**

- `docs/launch/demo-day-runbook.md`
- `docs/launch/demo-feedback.md`
- `npm run demo:seed`
- `npm run demo:reset`

## Week 2: Make It Neighbor-Ready

### Day 8: Production Database

- Choose production PostgreSQL provider: Neon, Supabase, Vercel Postgres, or similar.
- Create the production database.
- Run production migrations.
- Seed only the final production-ready settings.
- Confirm allowed streets are correct.

**Status:** Done.

**Decision:** Use PostgreSQL for launch. MongoDB is not needed for this version because the app already has a relational Prisma/PostgreSQL schema.

**Artifacts:**

- `docs/production/database-setup.md`
- `npm run prod:check`
- `npm run prod:migrate`

### Day 9: Stripe Setup

- Create or configure Stripe account.
- Add test API keys.
- Configure Checkout for card and Apple Pay.
- Add webhook endpoint.
- Test `checkout.session.completed` payment updates.
- Confirm adult booster payments stay blocked unless compliance is enabled and satisfied.

**Status:** Planned.

### Day 10: Deployment

- Push project to GitHub.
- Deploy app to Vercel.
- Add production environment variables.
- Connect production PostgreSQL.
- Run production migration deploy.
- Confirm homepage, admin, checkout, and confirmation pages work.

**Status:** Planned.

### Day 11: Admin Operations Setup

- Create the real admin account.
- Set final flavor list.
- Set final add-ons and prices.
- Configure Venmo and Cash App handles.
- Configure allowed streets.
- Add operating hours and pickup/delivery rules if needed.

**Status:** Planned.

### Day 12: Safety And Compliance

- Keep `ENABLE_ADULT_BOOSTERS=false`.
- Remove adult booster seed item from visible operations unless legally needed later.
- Review neighborhood-only delivery boundaries.
- Add simple refund/cancellation policy copy.
- Add privacy note for phone/address handling.
- Confirm no alcohol-related payment flow can run by default.

**Status:** Planned.

### Day 13: Mobile Testing

- Test iPhone Safari.
- Test Android Chrome.
- Test small phone screens.
- Test slow network behavior.
- Test admin dashboard from a phone.
- Test QR-code flow from scan to order submission.

**Status:** Planned.

### Day 14: Launch Prep

- Create QR code for the live site.
- Make a neighbor flyer or simple poster.
- Write ordering instructions.
- Publish operating hours.
- Run one final test order.
- Launch to a small group first, then expand.

**Status:** Planned.

## Launch Recommendation

For the first neighborhood launch, use Slushi Squad as a mobile-friendly web app opened from a QR code or shared link. A downloadable App Store app can come later. A Progressive Web App install option is the best next step if families want an app-like icon on their phones.

## Current Completion Snapshot

- Days 1-8 are implemented.
- Docker local database setup works.
- Tests pass.
- Production build passes.
- Manual payment orders remain pending until admin review.
- Neighborhood-only checkout is enforced.
- Admin dashboard is now a phone-friendly command center with quick status actions, payment review, price edit modals, and completion safety checks.
- Demo day runbook and seeded fake orders are ready.
- PostgreSQL is selected and documented as the production database path.


## Day 7-8 Verification

- `npm run demo:seed` created 4 demo orders.
- `npm run demo:reset` removed the 4 demo orders.
- `npm test` passed: 7 files, 18 tests.
- `npm run build` passed.
- `npm run prod:check` correctly fails until real production environment variables are provided.
