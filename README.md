## CanteenX – Smart Campus Canteen (Web + API)

**CanteenX** is a production-ready web application for managing a campus canteen, with:
- React/Vite PWA frontend (student + admin flows)
- Node/Express backend using Supabase PostgreSQL
- Realtime updates for orders, menu, and inventory
- Role-based access (student, admin/staff)

### 1. Tech stack

- **Frontend**: React 18, Vite, React Router, Zustand, `vite-plugin-pwa`
- **Backend**: Node.js, Express, Supabase (`@supabase/supabase-js`)
- **Database**: Supabase PostgreSQL (schema in `backend/src/migrations/schema.sql`)
- **Auth**: Supabase Auth (email/password), JWT, profiles table for roles
- **Realtime**: Supabase Realtime (orders, menu_items, inventory_alerts)
- **Security**: Helmet, CORS, rate limiting, JWT auth, role-based guards
- **Packaging**: Dockerfile + `docker-compose.yml`
- **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`)

### 2. Features

- **User roles**
  - `student` (customer): browse menu, manage cart, place orders, track status, see history, manage profile.
  - `admin` & `staff`: dashboard KPIs, orders console, menu CRUD + specials, inventory alerts and restocking.

- **Menu management**
  - Categories and menu_items with price, stock, specials, addons, veg/non-veg, images (file upload).
  - Admin UI for add/edit/delete, toggle availability, mark today’s specials.

- **Orders**
  - Student cart and checkout (wallet / UPI / card / cash methods).
  - Order lifecycle: `placed → confirmed → preparing → ready → collected / cancelled`.
  - Realtime tracking for students; admin can advance/cancel orders.

- **Inventory**
  - Stock per item, min stock, automatic low/critical/out-of-stock alerts.
  - Admin inventory summary + active alerts and restock actions.

- **Payments**
  - Order records store `payment_method` and `payment_status`.
  - Wallet payments are validated and deducted server-side.
  - UPI/card/cash are marked as `pending` for integration with a real gateway or cash collection.

- **Notifications**
  - In-app toast notifications throughout the app.
  - Browser notifications (when permitted) when an order moves to `ready`.
  - Realtime inventory alerts for admin dashboard.

### 3. Setup

#### 3.1. Supabase (database + auth)

1. Create a Supabase project.
2. In Supabase SQL editor, run:
   - `backend/src/migrations/schema.sql`
   - `backend/src/migrations/add-notification-prefs.sql`
   - `backend/src/migrations/add-staff-role.sql` (if upgrading; adds staff role support)
   - `backend/src/migrations/update-trigger-phone.sql` (if needed)
   - `backend/src/migrations/add-otp-codes.sql` (optional OTP table)
3. Create service users with `backend/src/seed-auth.js`:

```bash
cd backend
cp .env.example .env    # fill SUPABASE_URL and SUPABASE_SERVICE_KEY
npm install
node src/seed-auth.js
```

This seeds an admin and a test student and ensures `profiles` rows exist.

#### 3.2. Backend env

`backend/.env`:

```bash
PORT=4000
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
CORS_ORIGIN=https://your-frontend-domain.com
```

#### 3.3. Web env

`web/.env`:

```bash
VITE_API_URL=http://localhost:4000/api   # or your deployed API base
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Local development

```bash
# from repo root
npm install
npm run install:all

# start backend
npm run dev:backend

# start web (in another terminal)
npm run dev:web
```

Visit `http://localhost:3000`.

### 5. Docker

Build and run everything (backend + built web) with:

```bash
docker compose up --build
```

Configure Supabase and other env vars using a `.env` file next to `docker-compose.yml`.

### 6. Deployment (Render)

This repo includes `render.yaml` for Render’s Node web service:
- Build: `npm run render:build`
- Start: `npm start`
- Exposes `/api/*` for the backend and serves the built web app from `web/dist`.

**→ See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete step-by-step hosting instructions**, including all required environment variables and Supabase configuration.

### 7. CI

GitHub Actions workflow `.github/workflows/ci.yml` will:
- Install dependencies
- Install backend & web dependencies
- Build the web app
- Run API verification (`npm run verify`) when `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets are set

Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to GitHub repo secrets to enable the verify step.

### 8. Notes / Extensibility

- **Payment gateway**: integrate Razorpay/Stripe/etc. by:
  - Creating a small gateway module in the backend that verifies signatures and updates `payment_status` to `paid`.
  - Hitting your payment intent endpoint from `CheckoutPage` before placing the order.
- **Backups**: use Supabase’s managed backups and/or scheduled SQL dumps for recovery.
- **Monitoring**: attach a log drain from Render or use a service like Sentry or Logtail for error tracking.
- **Tests**: start from `backend/src/verify.js` to build automated API checks, and add frontend component tests with Vitest/React Testing Library.

