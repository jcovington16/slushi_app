# Demo Day Runbook

Use this for the family and neighborhood practice run before the real launch.

## Goal

Make sure a customer can place an order from a phone and the admin can keep up with orders from the dashboard.

## Before The Demo

1. Start the local database and app.

```bash
npm run db:setup
npm run dev:local
```

2. Seed practice orders.

```bash
npm run demo:seed
```

3. Open the app.

- Customer site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`

4. Log in as admin.

- Email: `admin@slushisquad.local`
- Password: `change-me`

## Demo Script

### Customer Flow

- Place one delivery order on an allowed street, like `Main St`.
- Place one pickup order.
- Try one blocked street and confirm the friendly neighborhood-only message appears.
- Try Venmo or Cash App and confirm the order is pending.

### Admin Flow

- Find the new order in Active.
- Mark manual payment as paid.
- Move order from New to Preparing.
- Move Preparing to Ready.
- For delivery, move Ready to Out for Delivery.
- Mark paid orders Complete.
- Confirm unpaid orders cannot be completed.
- Toggle a flavor unavailable and confirm it disappears from customer ordering.
- Add and remove an allowed street.

## Cleanup

Remove seeded demo orders when finished.

```bash
npm run demo:reset
```

## Feedback Questions

- Was the order flow simple enough from a phone?
- Did any button or instruction feel confusing?
- Were the prices clear?
- Were pickup/delivery choices clear?
- Could the admin keep up with orders quickly?
- What flavors or add-ons should be changed before launch?
- What hours should Slushi Squad be open?
- What streets should be included at launch?
