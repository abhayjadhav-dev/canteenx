# CanteenX – Smart Campus Canteen MVP

A full-stack mobile ordering system for campus canteens, built with **React Native (Expo)** for two mobile apps (Student & Admin) and a **Node.js / Express / MongoDB** backend.

---

## Project Structure

```
canteenx/
├── backend/               # Express + MongoDB API
│   ├── src/
│   │   ├── models/        # Mongoose schemas (User, MenuItem, Order, Category, InventoryAlert)
│   │   ├── routes/        # REST endpoints (menu, categories, orders, users, inventory)
│   │   ├── seed.js        # Seed data (19 items, 5 categories, 3 users, sample orders)
│   │   └── server.js      # Express app entry point
│   ├── .env               # Environment variables
│   └── package.json
├── apps/
│   ├── student/           # Student-facing Expo app
│   │   ├── src/
│   │   │   ├── navigation/  # React Navigation (tabs + stack)
│   │   │   ├── screens/     # HomeScreen, ItemDetails, Cart, Checkout, OrderTracking, etc.
│   │   │   ├── services/    # Axios API client
│   │   │   ├── store/       # Zustand stores (cart, menu, orders, user)
│   │   │   └── theme/       # Design tokens (colors, typography, spacing)
│   │   ├── App.js
│   │   └── package.json
│   └── admin/             # Admin-facing Expo app
│       ├── src/
│       │   ├── navigation/  # React Navigation (tabs + stack)
│       │   ├── screens/     # Dashboard, OrdersList, MenuManagement, Inventory
│       │   ├── services/    # Axios API client (extended for admin CRUD)
│       │   ├── store/       # Zustand stores (dashboard, orders, menu, inventory)
│       │   └── theme/       # Shared design tokens
│       ├── App.js
│       └── package.json
└── README.md
```

---

## Prerequisites

| Tool      | Version  | Notes                                    |
|-----------|----------|------------------------------------------|
| Node.js   | ≥ 18     | LTS recommended                          |
| MongoDB   | ≥ 6      | Local install **or** MongoDB Atlas        |
| Expo CLI  | latest   | Installed globally or via npx             |
| Expo Go   | latest   | On your iOS / Android device or emulator  |

---

## Quick Start

### 1. Clone & Install

```bash
cd canteenx

# Backend
cd backend
npm install

# Student app
cd ../apps/student
npm install

# Admin app
cd ../admin
npm install
```

### 2. Start MongoDB

Make sure MongoDB is running locally on the default port (`27017`):

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows (if installed as a service it's already running)
# Or start manually:
mongod --dbpath "C:\data\db"

# Linux
sudo systemctl start mongod
```

### 3. Seed the Database

```bash
cd canteenx/backend
npm run seed
```

This creates:
- **5 categories** – Snacks, Meals, Beverages, Desserts, Breakfast
- **19 menu items** – with images, prices, stock quantities
- **3 users** – 2 students + 1 admin
- **3 sample orders** – in different statuses
- **3 inventory alerts** – low / critical / out-of-stock

### 4. Start the Backend

```bash
cd canteenx/backend
npm run dev        # nodemon (auto-restart)
# or
npm start          # plain node
```

The API will be available at **http://localhost:4000**. Verify with:

```
GET http://localhost:4000/health
```

### 5. Start the Student App

```bash
cd canteenx/apps/student
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press:
- `a` – open Android emulator
- `i` – open iOS simulator

### 6. Start the Admin App

```bash
cd canteenx/apps/admin
npx expo start --port 8082
```

> Use a different port to avoid conflicts if the student app is already running.

---

## API Endpoints

### Menu Items
| Method | Endpoint                       | Description                  |
|--------|--------------------------------|------------------------------|
| GET    | `/api/menu`                    | List items (filters: category, search, available, popular, veg) |
| GET    | `/api/menu/:id`                | Get single item              |
| POST   | `/api/menu`                    | Create item (admin)          |
| PUT    | `/api/menu/:id`                | Update item (admin)          |
| PATCH  | `/api/menu/:id/availability`   | Toggle availability          |
| PATCH  | `/api/menu/:id/stock`          | Update stock quantity        |
| DELETE | `/api/menu/:id`                | Delete item                  |

### Categories
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | `/api/categories`     | List categories     |
| POST   | `/api/categories`     | Create category     |
| PUT    | `/api/categories/:id` | Update category     |
| DELETE | `/api/categories/:id` | Delete category     |

### Orders
| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/orders`              | List orders (filters: status, user)  |
| GET    | `/api/orders/stats`        | Dashboard KPIs (revenue, counts)     |
| GET    | `/api/orders/:id`          | Get single order                     |
| POST   | `/api/orders`              | Place new order (auto-decrements stock) |
| PATCH  | `/api/orders/:id/status`   | Update order status                  |

### Users
| Method | Endpoint                | Description               |
|--------|-------------------------|---------------------------|
| GET    | `/api/users`            | List users                |
| GET    | `/api/users/:id`        | Get user                  |
| POST   | `/api/users`            | Create user               |
| PATCH  | `/api/users/:id/wallet` | Credit / debit wallet     |

### Inventory
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| GET    | `/api/inventory/alerts`         | List inventory alerts   |
| GET    | `/api/inventory/summary`        | Aggregated summary      |
| PATCH  | `/api/inventory/restock/:itemId`| Add stock to item       |
| PATCH  | `/api/inventory/alerts/:id/resolve` | Resolve an alert    |

---

## Key Features

### Student App
- **Browse menu** with category filters, search, and popular items
- **Item details** with add-ons, special instructions, quantity picker
- **Shopping cart** with running totals
- **Checkout** with pickup time and payment method selection (mock)
- **Order confirmation** with order number and token
- **Live order tracking** with animated timeline (polls every 5s)
- **Order history** with active / completed tabs
- **Profile** with wallet balance display

### Admin App
- **Dashboard** with KPI cards (revenue, orders, avg prep time, pending)
- **Orders management** – filter by status, advance order through workflow (placed → confirmed → preparing → ready → collected)
- **Menu management** – create/edit/delete items, toggle availability, stock controls
- **Inventory alerts** – severity-based alerts with one-tap restock

---

## Design System

| Token             | Value                           |
|-------------------|---------------------------------|
| Primary           | `#f97415` (orange)              |
| Background        | `#f8f7f5`                       |
| Surface           | `#ffffff`                       |
| Text Primary      | `#1e293b`                       |
| Success           | `#22c55e`                       |
| Error             | `#ef4444`                       |
| Warning           | `#f59e0b`                       |
| Border Radius SM  | 8px                             |
| Border Radius XL  | 16px                            |
| Fonts             | System (mirrors Plus Jakarta Sans weight scale) |

---

## Network Notes

- The Expo apps use `Platform.select` for the API base URL:
  - **Android emulator** → `http://10.0.2.2:4000/api`
  - **iOS simulator** → `http://localhost:4000/api`
  - **Physical device** → change the base URL in `src/services/api.js` to your machine's LAN IP (e.g. `http://192.168.1.100:4000/api`)

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Mobile    | React Native 0.76 · Expo SDK 52             |
| Navigation| React Navigation 7 (native-stack, bottom-tabs)|
| State     | Zustand 5                                    |
| HTTP      | Axios                                        |
| Backend   | Node.js · Express 4.21                       |
| Database  | MongoDB · Mongoose 8.7                       |
| Icons     | @expo/vector-icons (Ionicons)                |

---

## License

MIT – built for educational / hackathon purposes.
