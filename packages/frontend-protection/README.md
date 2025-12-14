# BotWall Frontend Protection (Currently Working NOT TESTED!)

Frontend protection script for BotWall - protects your frontend from unwanted bots with easy installation and comprehensive analytics.

## Features

- 🔒 **Bot Detection** - Automatically detects bots via user-agent patterns
- 🛡️ **Route Protection** - Protect specific routes from bot access
- 📊 **Analytics** - Track bot activity and send data to BotWall backend
- 💳 **Payment Integration** - Redirect bots to purchase credits
- 🚀 **Easy Installation** - Simple script tag or npm package
- 📱 **Framework Agnostic** - Works with React, Vue, Angular, static sites

## Quick Start

### Option 1: Script Tag (Recommended)

Add this to your HTML `<head>` section:

```html
<script src="https://cdn.botwall.com/protection.min.js" 
        data-site-id="your-site-id"
        data-protected-routes="/admin/*,/premium/*"
        data-analytics="true">
</script>
```

### Option 2: NPM Package

```bash
npm install @botwall/frontend-protection
```

```javascript
import BotWallProtection from '@botwall/frontend-protection';

BotWallProtection.init({
  siteId: 'your-site-id',
  protectedRoutes: ['/admin/*', '/premium/*'],
  analytics: true
});
```

## Configuration

### Script Tag Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-site-id` | string | **required** | Your BotWall site ID |
| `data-backend-url` | string | `https://botwall-api.onrender.com` | BotWall backend URL |
| `data-protected-routes` | string | `/admin/*,/premium/*` | Comma-separated routes to protect |
| `data-analytics` | boolean | `true` | Enable analytics tracking |
| `data-debug` | boolean | `false` | Enable debug logging |

### JavaScript Configuration

```javascript
const config = {
  siteId: 'your-site-id',                    // Required
  backendUrl: 'https://botwall-api.onrender.com', // Optional
  protectedRoutes: ['/admin/*', '/premium/*'],     // Optional
  analytics: true,                           // Optional
  debug: false                               // Optional
};
```

## Usage Examples

### Basic Protection

```html
<!-- Protect admin and premium routes -->
<script src="https://cdn.botwall.com/protection.min.js" 
        data-site-id="abc123">
</script>
```

### Advanced Configuration

```html
<!-- Custom configuration -->
<script src="https://cdn.botwall.com/protection.min.js" 
        data-site-id="abc123"
        data-backend-url="https://your-backend.com"
        data-protected-routes="/admin/*,/api/*,/premium/*"
        data-analytics="true"
        data-debug="true">
</script>
```

### React Integration

```jsx
import { useEffect } from 'react';
import BotWallProtection from '@botwall/frontend-protection';

function App() {
  useEffect(() => {
    BotWallProtection.init({
      siteId: 'abc123',
      protectedRoutes: ['/admin/*', '/premium/*'],
      analytics: true
    });
  }, []);

  return <YourApp />;
}
```

### Vue Integration

```vue
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
import BotWallProtection from '@botwall/frontend-protection';

export default {
  name: 'App',
  mounted() {
    BotWallProtection.init({
      siteId: 'abc123',
      protectedRoutes: ['/admin/*', '/premium/*']
    });
  }
}
</script>
```

## Route Patterns

The protection script supports glob patterns for route matching:

- `/*` - All routes
- `/admin/*` - All admin routes
- `/api/*` - All API routes
- `/premium/*` - All premium routes
- `/blog/*` - All blog routes
- `/user/:id` - User profile routes

## Bot Detection

The script automatically detects common bots:

- **Search Engines**: GoogleBot, BingBot, Yahoo Slurp
- **AI Models**: GPTBot, ChatGPT, Claude, Anthropic
- **Social Media**: Facebook, Twitter, LinkedIn, WhatsApp
- **Other**: DuckDuckBot, BaiduSpider, YandexBot

## Analytics

When enabled, the script sends analytics data to your BotWall backend:

- Bot detection events
- Route access attempts
- User agent information
- Page paths visited
- Timestamp data

## Payment Flow

When a bot tries to access a protected route:

1. **Detection** - Bot is detected via user-agent
2. **Route Check** - Checks if current route is protected
3. **Overlay** - Shows payment overlay with BotWall branding
4. **Redirect** - Redirects to BotWall payment page
5. **Return** - Returns to original page after payment

## API Reference

### BotWallProtection.init(config)

Initialize the protection system.

```javascript
BotWallProtection.init({
  siteId: 'abc123',
  protectedRoutes: ['/admin/*'],
  analytics: true
});
```

### updateConfig(newConfig)

Update configuration after initialization.

```javascript
const protection = BotWallProtection.init(config);
protection.updateConfig({
  protectedRoutes: ['/admin/*', '/api/*']
});
```

### getConfig()

Get current configuration.

```javascript
const config = protection.getConfig();
console.log(config.siteId); // 'abc123'
```

## Troubleshooting

### Script Not Loading

1. Check if the CDN URL is accessible
2. Verify your site ID is correct
3. Check browser console for errors

### Bots Not Being Detected

1. Enable debug mode: `data-debug="true"`
2. Check browser console for detection logs
3. Verify user-agent patterns

### Analytics Not Sending

1. Check network tab for failed requests
2. Verify backend URL is correct
3. Check CORS settings on your backend

### Payment Overlay Not Showing

1. Verify protected routes are correctly configured
2. Check if the route matches the pattern
3. Enable debug mode to see detection logs

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/botwall/botwall-pay-per-crawl.git

# Install dependencies
cd packages/frontend-protection
npm install

# Build the package
npm run build
```

### Local Development

```bash
# Start development mode
npm run dev

# Build for production
npm run build
```

## Support

- **Documentation**: [https://botwall.com/docs](https://botwall.com/docs)
- **Issues**: [GitHub Issues](https://github.com/botwall/botwall-pay-per-crawl/issues)
- **Email**: support@botwall.com

## License

MIT License - see [LICENSE](../../LICENSE) for details. 
