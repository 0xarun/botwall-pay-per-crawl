# BotWall Pay-Per-Crawl Monorepo

now testing on: https://botwall.onrender.com/

## Overview

BotWall is a modern, open-source pay-per-crawl system that empowers site owners to monetize their content and enables bot developers to access protected data ethically. The system uses cryptographic signatures (Ed25519) for bot authentication and a credit-based payment model for API access.

---

## 🏗️ Architecture

- **Frontend (Dashboard):** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript + PostgreSQL/SQLite
- **SDK:** TypeScript/JavaScript SDK for bot developers
- **Middleware:** Express middleware for site owners to protect their APIs

---

## 🚀 Quick Start (Monorepo)

1. **Install all dependencies:**
   ```bash
   npm install
   ```
2. **Build all packages:**
   ```bash
   npm run build
   ```
3. **Run all dev servers:**
   ```bash
   npm run dev
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details on contributing and development.

---

## 🛡️ For Site Owners: Protect Your API (Easiest Path)

1. **Install the middleware:**
   ```bash
   npm install @botwall/middleware
   ```
2. **Add to your Express app:**
   ```js
   const { validateCrawlRequest } = require('@botwall/middleware');
   app.use('/api', validateCrawlRequest);
   ```

That’s it! Your `/api` routes are now protected by BotWall.

---

## 🤖 For Bot Developers: Make a Signed Crawl Request (Easiest Path)

1. **Install the SDK:**
   ```bash
   npm install @botwall/sdk
   ```
2. **Send a signed crawl request:**
```js
import { signRequest, sendCrawlRequest } from '@botwall/sdk';

const headers = {
  'crawler-id': 'YOUR_BOT_ID',
  'crawler-max-price': '0.05',
  'signature-input': 'crawler-id crawler-max-price',
};

headers['signature'] = signRequest(headers, 'YOUR_PRIVATE_KEY_BASE64');

await sendCrawlRequest('https://target-site.com/api/protected', headers);

```

- For advanced usage (keypair generation, manual signing, error handling, etc.), see the [SDK README](./packages/sdk/README.md).

---

## 🔒 Ed25519 Signature Flow
- Each bot signs requests with their private key.
- The public key is registered with BotWall during onboarding.
- The middleware verifies the signature using the public key.
- Required headers:
  - `crawler-id`, `crawler-max-price`, `signature-input`, `signature`

---

## 🧩 Project Structure
```
botwall-pay-per-crawl/
├── dashboard/           # Frontend React app
├── packages/
│   ├── backend/         # Express.js backend
│   ├── middleware/      # Express middleware for site owners
│   └── sdk/             # SDK for bot developers
├── README.md
├── CONTRIBUTING.md
└── ...
```

---

## 🔧 Backend API (Selected Endpoints)
- `POST /api/verify` — Core endpoint for crawl verification
- `POST /api/verify/deduct-credits` — Manually deduct credits
- `GET /api/sites` — List sites for a user
- `GET /api/bots` — List bots for a user
- `POST /api/transactions` — Purchase credits

---

## 💳 Payments & Credits

### How Credits Work
- **Bots** need credits to crawl protected endpoints. Each successful crawl deducts 1 credit.
- If a bot has insufficient credits, the crawl is denied.

### Purchasing Credits
- **Credit Packs:** Choose from packs (Starter, Pro, Enterprise) defined in the backend config.
- **Purchase Flow:**
  1. Bot developer selects a pack and initiates a purchase.
  2. A transaction is created in the backend (`/api/transactions`).
  3. The backend can create a **real LemonSqueezy checkout session** (`/api/transactions/create-checkout`) if LemonSqueezy is configured.
  4. After payment, a webhook from LemonSqueezy credits the bot and marks the transaction as complete.

### Mock/Test Credits for Open Source
- For local development and open source, use the **mock credit endpoint**:
  - `POST /api/bots/:id/mock-add-credits`
  - Only available in development mode (`NODE_ENV=development`)
  - Instantly adds credits to any bot for testing, no real payment needed.

### Simulated Checkout for Testing
- Use `/api/transactions/checkout` to simulate a payment gateway and get a fake checkout URL for local testing.
- Simulate payment processing with `/api/transactions/process/:id`.

### LemonSqueezy Integration (Real Payments)
- To enable real payments, set these environment variables in your backend:
  - `LEMONSQUEEZY_API_KEY`
  - `LEMONSQUEEZY_STORE_ID`
  - `LEMONSQUEEZY_WEBHOOK_SECRET`
- The backend will handle real checkouts and webhooks to credit bots after payment.

### Site Owner Earnings
- Site owners earn money based on their `price_per_crawl` and the number of successful crawls on their sites.
- Earnings are tracked in the backend and viewable via analytics endpoints.

### Testing Payments & Credits (Open Source Mode)
- Use the mock credit endpoint to add credits to bots instantly.
- Use the simulated checkout endpoints to test the full purchase and crediting flow without real money.
- For real payments, configure LemonSqueezy and use the real checkout flow.

---

## 🛠️ Development

### Running in Development
- **Backend:**
  ```bash
  cd packages/backend
  npm run dev
  ```
- **Frontend (Dashboard):**
  ```bash
  cd dashboard
  npm run dev
  ```
- **SDK and Middleware:**
  - Develop/test independently in their respective folders.

### Building for Production
- **Backend:**
  ```bash
  cd packages/backend
  npm run build
  npm start
  ```
- **Frontend:**
  ```bash
  cd dashboard
  npm run build
  # Deploy the dist/ folder to your hosting provider
  ```

### Running Tests
- (Add test instructions here if/when tests are implemented)

---

## 🌱 Environment Setup

### Quick Start
1. Copy environment example files:
   ```bash
   cp dashboard/env.example dashboard/.env.local
   cp packages/backend/env.example packages/backend/.env
   ```
2. Update the variables in each file for your environment
3. See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

### Frontend Environment (Dashboard)
Copy `dashboard/env.example` to `dashboard/.env.local` and configure:
```bash
VITE_BACKEND_URL=http://localhost:3001/api  # Development
# VITE_BACKEND_URL=https://your-api-domain.com/api  # Production
```

### Backend Environment
Copy `packages/backend/env.example` to `packages/backend/.env` and configure:
```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

### Required Variables
- **Backend**: `DATABASE_URL`, `JWT_SECRET`
- **Frontend**: `VITE_BACKEND_URL` (optional, has defaults)

### Optional Variables
- LemonSqueezy payment integration
- Feature flags for mock credits and analytics
- Logging configuration

---

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and best practices.

---

## 📄 License
MIT (add your LICENSE file when publishing)

---

## 🧑‍💻 Why Monorepo & Workspaces?
BotWall uses a monorepo with npm workspaces for:
- Unified dependency management (install everything with one command)
- Easy cross-package development (SDK, middleware, backend, frontend)
- Consistent scripts for build, dev, and test
- Single source of truth for issues, docs, and code
- Scalable, contributor-friendly open source workflow

---

## ❓ Need Help?
- For SDK usage, see [SDK README](./packages/sdk/README.md)
- For middleware usage, see [Middleware README](./packages/middleware/README.md)
- Open an issue or discussion on GitHub for questions or support.

---

## 👤 Project Maintainer
- Arun — [x.com/0xarun](https://x.com/0xarun) | [linkedin.com/in/0xarun](https://linkedin.com/in/0xarun)