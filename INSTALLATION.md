# BotWall Installation Guide

Quick setup guide for BotWall protection.

## Quick Start

### 1. Get Your Site ID
- Sign up at [botwall.com](https://botwall.com)
- Create a site and get your Site ID

### 2. Backend Protection

```bash
npm install @botwall/middleware
```

```javascript
const { validateCrawlRequest } = require('@botwall/middleware');

app.use('/api', validateCrawlRequest({
  siteId: 'your-site-id'
}));
```

### 3. Frontend Protection

Add to your HTML `<head>`:

```html
<script src="https://cdn.botwall.com/protection.min.js" 
        data-site-id="your-site-id">
</script>
```

## Framework Setup

### Express.js
```javascript
app.use('/api', validateCrawlRequest({
  siteId: 'your-site-id',
  monetizedRoutes: ['/api/protected/*']
}));
```

### React
```jsx
import BotWallProtection from '@botwall/frontend-protection';

useEffect(() => {
  BotWallProtection.init({
    siteId: 'your-site-id',
    protectedRoutes: ['/admin/*']
  });
}, []);
```

### Next.js
```javascript
// pages/_app.js
useEffect(() => {
  BotWallProtection.init({
    siteId: process.env.NEXT_PUBLIC_BOTWALL_SITE_ID
  });
}, []);
```

## Testing

```bash
# Test browser access (should work)
curl -H "User-Agent: Mozilla/5.0" http://localhost:3000/api/public

# Test bot access (should be blocked on protected routes)
curl -H "User-Agent: GPTBot" http://localhost:3000/api/protected
```

## Support

- **Docs**: [botwall.com/docs](https://botwall.com/docs)
- **Email**: support@botwall.com
- **GitHub**: [github.com/botwall/botwall-pay-per-crawl](https://github.com/botwall/botwall-pay-per-crawl) 