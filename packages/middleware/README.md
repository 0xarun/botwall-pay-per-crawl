# BotWall Middleware

Express middleware for protecting your API routes with pay-per-crawl, signature verification, and bot analytics.

## Installation

```bash
npm install @botwall/middleware
```

## Quick Start

```javascript
const express = require('express');
const { validateCrawlRequest } = require('@botwall/middleware');

const app = express();

// Basic protection
app.use('/api', validateCrawlRequest({
  siteId: 'your-site-id'
}));

// Advanced configuration
app.use('/api', validateCrawlRequest({
  siteId: 'your-site-id',
  backendUrl: 'https://botwall-api.onrender.com',
  monetizedRoutes: ['/api/protected/*'],
  pricePerCrawl: 0.01
}));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Features

- 🔒 **Bot Detection** - Automatically detects bots via user-agent patterns
- 💳 **Pay-per-Crawl** - Charge bots for accessing protected routes
- 🔐 **Signature Verification** - Verify Ed25519 signatures for authenticated bots
- 📊 **Analytics** - Track bot activity and send data to BotWall backend
- 🛡️ **Route Protection** - Protect specific routes from unauthorized access
- 🚀 **Easy Setup** - Simple middleware configuration

## Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `siteId` | string | **required** | Your BotWall site ID |
| `backendUrl` | string | `https://botwall-api.onrender.com` | BotWall backend URL |
| `monetizedRoutes` | string[] | `['/api/protected/*']` | Routes that require payment |
| `pricePerCrawl` | number | `0.01` | Price per crawl in USD |

### Example Configurations

#### Basic Protection
```javascript
app.use('/api', validateCrawlRequest({
  siteId: 'abc123'
}));
```

#### Custom Routes
```javascript
app.use('/api', validateCrawlRequest({
  siteId: 'abc123',
  monetizedRoutes: ['/api/data/*', '/api/premium/*']
}));
```

#### Custom Backend
```javascript
app.use('/api', validateCrawlRequest({
  siteId: 'abc123',
  backendUrl: 'https://your-backend.com'
}));
```

## How It Works

1. **Request Arrives** - Middleware intercepts incoming requests
2. **Bot Detection** - Checks user-agent for bot patterns
3. **Browser Check** - Allows legitimate browsers immediately
4. **Route Check** - Determines if route is monetized
5. **Protection Applied** - Blocks bots or requires payment
6. **Analytics Logged** - Sends data to BotWall backend

## Bot Types

### Browsers
- ✅ **Always Allowed** - No restrictions
- ✅ **Analytics Logged** - For monitoring purposes

### Known Bots (Google, Bing, etc.)
- ✅ **Configurable** - Allow/block per site preferences
- ✅ **Analytics Logged** - Track activity

### Signed Bots (Your Bots)
- ✅ **Signature Verified** - Ed25519 verification
- ✅ **Credits Checked** - Must have sufficient credits
- ✅ **Payment Required** - Deducts credits per request

### Unknown Bots
- ❌ **Blocked** - On monetized routes
- ✅ **Analytics Logged** - Track activity

## Testing

### Test Browser Access
```bash
curl -H "User-Agent: Mozilla/5.0" http://localhost:3000/api/public
# Should work ✅
```

### Test Bot Access
```bash
curl -H "User-Agent: GPTBot" http://localhost:3000/api/protected
# Should be blocked ❌
```

### Test Signed Bot
```bash
curl -H "User-Agent: CustomBot" \
     -H "crawler-id: your-bot-id" \
     -H "signature-input: crawler-id" \
     -H "signature: your-signature" \
     http://localhost:3000/api/protected
# Should work with credits ✅
```

## Support

- **Documentation**: [https://botwall.com/docs](https://botwall.com/docs)
- **Issues**: [GitHub Issues](https://github.com/botwall/botwall-pay-per-crawl/issues)
- **Email**: support@botwall.com

## License

MIT License - see [LICENSE](../../LICENSE) for details. 