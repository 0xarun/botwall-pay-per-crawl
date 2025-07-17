# BotWall Middleware

Express middleware for protecting your API routes with pay-per-crawl and signature verification.

## Installation
```bash
npm install @botwall/middleware
```

## Usage
```js
const { validateCrawlRequest } = require('@botwall/middleware');
app.use('/api', validateCrawlRequest);
```

- No credentials or secrets needed. The middleware:
  - Detects bots via headers/signatures
  - Enforces pricing per path
  - Verifies Ed25519 signatures
  - Calls the backend to deduct credits and log crawls

## API
- `validateCrawlRequest(req, res, next)` — Express middleware for pay-per-crawl protection

---

## 👤 Maintainer
- Arun — [x.com/0xarun](https://x.com/0xarun) | [linkedin.com/in/0xarun](https://linkedin.com/in/0xarun) 