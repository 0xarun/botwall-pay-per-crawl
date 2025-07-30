# BotWall Middleware

Express middleware for protecting your API routes with pay-per-crawl, signature verification, bot analytics, and intelligent bot management.

## Installation
```bash
npm install @botwall/middleware
```

## Usage
```js
const { validateCrawlRequest } = require('@botwall/middleware');

app.use('/article', validateCrawlRequest());
```

- No credentials or secrets needed. The middleware:
  - Detects bots via headers/signatures and user-agent patterns
  - Enforces pricing per path (via backend API)
  - Verifies Ed25519 signatures for signed bots
  - Provides comprehensive bot analytics and logging
  - Supports site-specific bot allow/block preferences
  - Handles known bots (search engines, LLMs) and unknown bots
  - Calls the backend to deduct credits and log crawls

## Configuration
- `backendUrl` (optional): The base URL of your backend API. If not provided, the middleware will use `process.env.BACKEND_URL` or a default value.
- No database or .env setup is required for the middleware package itself.

## Features

### Bot Detection & Management
- **Signed Bots**: Verifies Ed25519 signatures for authenticated crawlers
- **Known Bots**: Detects search engines, LLMs, and other known bots via user-agent patterns
- **Unknown Bots**: Handles unidentified bots with analytics tracking
- **Site-Specific Rules**: Supports per-site bot allow/block preferences

### Analytics & Logging
- Comprehensive bot crawl logging with IP addresses, user agents, and request details
- Real-time analytics for bot traffic patterns
- Performance-optimized caching for bot lists and site preferences

## API
- `validateCrawlRequest(options)` — Express middleware for comprehensive bot protection
  - `options.backendUrl` (optional): Backend API base URL for pricing, public key lookups, and analytics.

---

## 👤 Maintainer
- Arun — [x.com/0xarun](https://x.com/0xarun) | [linkedin.com/in/0xarun](https://linkedin.com/in/0xarun) 