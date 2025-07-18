# BotWall Middleware

Express middleware for protecting your API routes with pay-per-crawl and signature verification.

## Installation
```bash
npm install @botwall/middleware
```

## Usage
```js
const { validateCrawlRequest } = require('@botwall/middleware');

// Option 1: Use env var (recommended for most users)
app.use('/api', validateCrawlRequest({
  backendUrl: process.env.BACKEND_URL // e.g., 'http://localhost:3001' or 'https://botwall.com'
}));

// Option 2: Use default (middleware will use its built-in default or blank)
app.use('/api', validateCrawlRequest());
```

- No credentials or secrets needed. The middleware:
  - Detects bots via headers/signatures
  - Enforces pricing per path (via backend API)
  - Verifies Ed25519 signatures
  - Calls the backend to deduct credits and log crawls

## Configuration
- `backendUrl` (optional): The base URL of your backend API. If not provided, the middleware will use `process.env.BACKEND_URL` or a default value.
- No database or .env setup is required for the middleware package itself.

## API
- `validateCrawlRequest(options)` — Express middleware for pay-per-crawl protection
  - `options.backendUrl` (optional): Backend API base URL for pricing and public key lookups.

---

## 👤 Maintainer
- Arun — [x.com/0xarun](https://x.com/0xarun) | [linkedin.com/in/0xarun](https://linkedin.com/in/0xarun) 