# CanteenX – Deploy to Render

Complete step-by-step guide to deploy CanteenX on Render with Supabase, persistent uploads, and all required inputs.

---

## Prerequisites

- [GitHub](https://github.com) account (repo pushed)
- [Render](https://render.com) account (free tier works)
- [Supabase](https://supabase.com) project (free tier works)

---

## 1. Supabase Setup

### 1.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. **New project** → name it `canteenx` (or any name)
3. Choose region closest to your users
4. Set a database password (save it)
5. Wait for the project to be ready

### 1.2 Run the schema

1. In Supabase Dashboard → **SQL Editor** → **New query**
2. Copy and run these migrations in order:
   - `backend/src/migrations/schema.sql`
   - `backend/src/migrations/add-notification-prefs.sql`
   - `backend/src/migrations/add-staff-role.sql`
3. Ensure all tables are created: `profiles`, `categories`, `menu_items`, `orders`, `order_items`, `inventory_alerts`

### 1.3 Seed auth users (admin + student)

1. Get **Project URL** and **service_role key** from Supabase → **Settings** → **API**
2. Create `backend/.env` locally:
   ```bash
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
3. Run:
   ```bash
   cd backend && npm install && node src/seed-auth.js
   ```
4. This creates:
   - `admin@canteenx.com` / `canteenx123` (admin)
   - `student@canteenx.com` / `canteenx123` (student, wallet 500)

### 1.4 Optional: Add categories & menu items via Supabase UI

1. Supabase → **Table Editor** → `categories` → insert rows (e.g. Snacks, Meals, Beverages)
2. `menu_items` → add items with `category_id`, `name`, `price`, etc.

---

## 2. Render Setup

### 2.1 Create a Web Service

1. Go to [render.com](https://render.com) → **Dashboard**
2. **New** → **Web Service**
3. Connect your GitHub repo
4. Render will detect `render.yaml`; choose **Apply** or configure manually

### 2.2 Configure the service (if not using Blueprint)

| Field | Value |
|-------|-------|
| Name | `canteenx` |
| Region | Oregon (US West) or nearest |
| Branch | `main` (or your default) |
| Runtime | Node |
| Build Command | `npm run render:build` |
| Start Command | `npm start` |
| Instance Type | Free |

### 2.3 Environment variables (required)

In Render → **Environment** → add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Set automatically by render.yaml |
| `PORT` | `4000` | Set automatically by render.yaml |
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | From Supabase Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase Settings → API (Project API keys → anon/public) |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | From Supabase Settings → API (service_role) |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Same as SUPABASE_ANON_KEY |
| `CORS_ORIGIN` | `https://YOUR-SERVICE.onrender.com` | Your Render URL (optional, use `*` for dev) |

Important:

- `VITE_*` values are baked into the frontend at build time; they must be set before the first build
- `SUPABASE_SERVICE_KEY` is secret; use Render “Secret” type
- `SUPABASE_ANON_KEY` can be public (client-side); set as regular env var

### 2.4 Persistent disk (uploads)

1. In Render service → **Disks**
2. Add disk:
   - Name: `uploads`
   - Mount Path: `/opt/render/project/src/backend/uploads`
   - Size: 1 GB

This keeps uploaded images across deploys.

---

## 3. Deploy

1. Save all environment variables
2. Click **Deploy** (or push to `main` if auto-deploy is on)
3. Wait for build to finish
4. Visit `https://YOUR-SERVICE.onrender.com`

---

## 4. Post-deploy checks

1. **Health**: `https://YOUR-SERVICE.onrender.com/api/health` → `{"status":"ok"}`
2. **Login**: Use `admin@canteenx.com` / `canteenx123` or `student@canteenx.com` / `canteenx123`
3. **Menu & categories**: Add via admin UI or Supabase Table Editor
4. **Orders**: Place a test order as student
5. **Uploads**: Upload an image in menu management; refresh to confirm it persists

---

## 5. GitHub CI (optional)

To run API verification in CI:

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push; CI will build, start the API, and run `npm run verify` (smoke tests)

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 / timeout | Free tier spins down after inactivity; first load may take 30–60s |
| Images 404 | Ensure disk is mounted at `/opt/render/project/src/backend/uploads` |
| Login fails | Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match Supabase project |
| CSP / "Refused to connect" | Ensure `SUPABASE_URL` is set in the backend (not just VITE_*). The backend adds Supabase to the Content-Security-Policy. |
| Auth redirect error | In Supabase → Auth → URL Configuration, add `https://YOUR-SERVICE.onrender.com` to Site URL and Redirect URLs |
| Build fails | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set before build |

---

## 7. Summary: minimal env vars for Render

```
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
CORS_ORIGIN=https://canteenx.onrender.com
```

Replace `xxx` with your Supabase project ref and `canteenx.onrender.com` with your actual Render URL.
