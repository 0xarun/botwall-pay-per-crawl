# Middleware Verification System

The Botwall middleware verification system allows site owners to verify that their middleware is properly installed and functioning correctly.

## Overview

When a site owner installs the Botwall middleware on their site, they can use the verification system to:

1. **Check installation status** - Verify if middleware is detected and responding
2. **Monitor health** - Track when the middleware last reported its status
3. **Debug issues** - Get detailed error messages if verification fails
4. **Get installation instructions** - Step-by-step guidance for proper setup

## How It Works

### 1. Health Check Endpoint

The middleware calls a health check endpoint to report its status:

```
GET /api/sites/{siteId}/health-check?token={verificationToken}&version={middlewareVersion}
```

**Parameters:**
- `siteId` - The unique identifier for the site
- `token` - Secret verification token (generated when site is created)
- `version` - Optional middleware version string

**Response:**
```json
{
  "status": "ok",
  "message": "Middleware health check successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Verification Status Tracking

The system tracks verification status in the `middleware_verification` table:

- `status` - Current status: `installed`, `not_installed`, `error`, `unknown`
- `last_check` - When the middleware last called the health check
- `last_successful_check` - When the last successful health check occurred
- `verification_token` - Secret token for authentication
- `middleware_version` - Version of middleware detected
- `error_message` - Error details if verification fails

### 3. Dashboard Integration

Site owners can view middleware status in their dashboard:

- **Real-time status** - Shows current verification status with visual indicators
- **Last check time** - Displays when middleware last reported
- **Error details** - Shows specific error messages if verification fails
- **Installation instructions** - Step-by-step setup guidance

## Implementation Guide

### For Middleware Developers

1. **Add Health Check Functionality**

```javascript
const { startHealthCheck } = require('@botwall/middleware');

// Start health checks when middleware initializes
const healthChecker = startHealthCheck({
  backendUrl: 'https://your-backend.com',
  siteId: 'your-site-id',
  verificationToken: 'your-verification-token',
  middlewareVersion: '1.0.0'
});

// Stop health checks when shutting down
process.on('SIGINT', () => {
  healthChecker.stop();
});
```

2. **Manual Health Check**

```javascript
const { MiddlewareHealthChecker } = require('@botwall/middleware');

const checker = new MiddlewareHealthChecker({
  backendUrl: 'https://your-backend.com',
  siteId: 'your-site-id',
  verificationToken: 'your-verification-token',
  middlewareVersion: '1.0.0'
});

// Send a single health check
const result = await checker.sendHealthCheck();
console.log('Health check result:', result);
```

### For Site Owners

1. **View Status in Dashboard**

Navigate to the "Middleware" section in your site owner dashboard to see:
- Current verification status
- Last check time
- Error messages (if any)
- Installation instructions

2. **Trigger Verification**

Click the "Verify" button to:
- Generate a new verification token (if needed)
- Get the health check URL
- Receive step-by-step installation instructions

3. **Use Verification Script**

Run the verification script to test your middleware:

```bash
node verification-script.js https://your-site.com --verbose
```

This script will:
- Test normal user requests
- Test bot detection
- Test rate limiting
- Check health endpoints
- Provide a detailed report

## API Endpoints

### Health Check (Public)
```
GET /api/sites/{siteId}/health-check
```

### Trigger Verification (Authenticated)
```
POST /api/sites/{siteId}/verify-middleware
```

### Get Status (Authenticated)
```
GET /api/sites/{siteId}/middleware-status
```

## Status Meanings

- **`installed`** - Middleware is detected and responding correctly
- **`not_installed`** - Middleware is not detected or not responding
- **`error`** - Middleware is detected but reporting errors
- **`unknown`** - No verification data available (default for new sites)

## Troubleshooting

### Common Issues

1. **"Middleware not detected"**
   - Ensure middleware is properly installed
   - Check that health check endpoint is being called
   - Verify the verification token is correct

2. **"Invalid verification token"**
   - Regenerate verification token in dashboard
   - Update middleware configuration with new token

3. **"Health check failed"**
   - Check network connectivity between middleware and backend
   - Verify backend URL is correct
   - Check middleware logs for errors

### Debug Steps

1. **Check middleware logs** for health check attempts
2. **Verify network connectivity** between middleware and backend
3. **Test health check endpoint** manually with curl
4. **Check verification token** matches dashboard
5. **Review error messages** in dashboard for specific issues

## Security Considerations

- Verification tokens are cryptographically secure random strings
- Tokens are unique per site and should be kept confidential
- Health check endpoints validate tokens before updating status
- Failed health checks don't expose sensitive information

## Best Practices

1. **Regular Health Checks** - Configure middleware to send health checks every 5-10 minutes
2. **Error Handling** - Implement proper error handling in health check logic
3. **Version Tracking** - Include middleware version in health checks for debugging
4. **Monitoring** - Set up alerts for failed health checks
5. **Documentation** - Keep installation instructions up to date

## Example Integration

Here's a complete example of integrating health checks into an Express middleware:

```javascript
const express = require('express');
const { validateCrawlRequest } = require('@botwall/middleware');
const { startHealthCheck } = require('@botwall/middleware');

const app = express();

// Initialize Botwall middleware
const botwallMiddleware = validateCrawlRequest({
  backendUrl: process.env.BOTWALL_BACKEND_URL
});

// Apply middleware to routes
app.use('/api', botwallMiddleware);

// Start health checks
const healthChecker = startHealthCheck({
  backendUrl: process.env.BOTWALL_BACKEND_URL,
  siteId: process.env.BOTWALL_SITE_ID,
  verificationToken: process.env.BOTWALL_VERIFICATION_TOKEN,
  middlewareVersion: '1.0.0'
});

// Graceful shutdown
process.on('SIGINT', () => {
  healthChecker.stop();
  process.exit(0);
});

app.listen(3000, () => {
  console.log('Server running with Botwall middleware');
});
```

This verification system ensures that site owners can confidently deploy and monitor their Botwall middleware installation. 