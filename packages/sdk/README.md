# BotWall SDK

The official BotWall SDK for protecting your content and accessing protected data ethically.

## Installation

```bash
npm install @botwall/sdk
```

## Quick Start

### For Site Owners

Protect your routes and monetize bot access:

```javascript
const { payPerCrawlMiddleware } = require('@botwall/sdk');

// Basic protection
app.use('/api', payPerCrawlMiddleware({
  siteId: 'your_site_id',
  siteSecret: 'your_site_secret'
}));
```

### For Bot Developers (Ed25519 Signature Flow)

Bot developers can use the SDK to:
- Generate an Ed25519 keypair (public/private key)
- Sign requests to protected endpoints using their private key
- (Optionally) Send signed crawl requests with fetch

#### 1. Generate a Keypair

```typescript
import { generateKeypair } from '@botwall/sdk';

const { publicKey, privateKey } = generateKeypair();
// Save publicKey to DB during onboarding
// Store privateKey securely (never share)
```

#### 2. Sign a Request

```typescript
import { signRequest } from '@botwall/sdk';

const headers = {
  'crawler-id': 'mybot.com',
  'crawler-max-price': '0.03',
  'signature-input': 'host path',
  'host': 'techblog.com',
  'path': '/docs',
};

headers['signature'] = signRequest(headers, myPrivateKey);

// Now send the request with these headers
fetch('https://techblog.com/docs', { headers });
```

#### 3. Send a Crawl Request (Auto-sign)

```typescript
import { sendCrawlRequest } from '@botwall/sdk';

const headers = {
  'crawler-id': 'mybot.com',
  'crawler-max-price': '0.03',
  'signature-input': 'host path',
  'host': 'techblog.com',
  'path': '/docs',
};

const response = await sendCrawlRequest('https://techblog.com/docs', headers, myPrivateKey);
const data = await response.text();
console.log(data);
```

---

## API Reference

### Bot Developer Functions

#### `generateKeypair()`
Generates a new Ed25519 keypair.
- Returns: `{ publicKey: string, privateKey: string }` (both base64-encoded)

#### `signRequest(headers, privateKey)`
Signs a canonical message (per `signature-input`) using Ed25519.
- `headers`: Object of headers (header names are case-insensitive)
- `privateKey`: base64-encoded Ed25519 private key
- Returns: base64-encoded signature string

#### `sendCrawlRequest(url, headers, privateKey, options?)`
Sends a crawl request, auto-signing the headers using Ed25519.
- `url`: The URL to fetch
- `headers`: Headers object (must include `signature-input` and required headers)
- `privateKey`: base64-encoded Ed25519 private key
- `options`: Optional fetch options (method, body, etc.)
- Returns: The fetch Response object

---

## Ed25519 Signature Flow

- No API keys are used for bot authentication.
- Each bot signs requests with their private key.
- The public key is stored in the BotWall database during onboarding.
- The middleware on the publisher site verifies the signature using the public key.

**Required Headers for Protected Endpoints:**
- `crawler-id`: Bot's domain name (e.g., gptbot.com)
- `crawler-max-price`: Max price the bot is willing to pay
- `signature-input`: Space-separated list of header names to sign (e.g., `host path`)
- `signature`: Ed25519 signature (base64) of the canonical message

**Canonical Message:**
- Concatenate the values of the headers listed in `signature-input`, separated by spaces.
- Sign this string using Ed25519 and the bot's private key.

---

## Example Bot Developer Flow

```typescript
import { generateKeypair, signRequest, sendCrawlRequest } from '@botwall/sdk';

// 1. Generate keypair (once)
const { publicKey, privateKey } = generateKeypair();
// Register publicKey with BotWall, keep privateKey safe

// 2. Prepare headers for a crawl
const headers = {
  'crawler-id': 'mybot.com',
  'crawler-max-price': '0.05',
  'signature-input': 'host path',
  'host': 'techblog.com',
  'path': '/api/data',
};

// 3. Sign the request
headers['signature'] = signRequest(headers, privateKey);

// 4. Send the request (manual or with helper)
const response = await sendCrawlRequest('https://techblog.com/api/data', headers, privateKey);
const data = await response.json();
console.log(data);
```

---

## Site Owner Functions

(See above for middleware usage)

---

## Error Handling

The SDK provides specific error classes for different scenarios:

```javascript
const { 
  InvalidCredentialsError, 
  InsufficientCreditsError, 
  NetworkError 
} = require('@botwall/sdk');

try {
  // ...
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    console.log('Invalid credentials');
  } else if (error instanceof InsufficientCreditsError) {
    console.log('Need to buy more credits');
  } else if (error instanceof NetworkError) {
    console.log('Network or server error');
  }
}
```

---

## Troubleshooting

### Common Issues

1. **"Invalid signature" error**
   - Ensure you are signing the correct canonical message (per `signature-input`)
   - Make sure header names are lowercased and match exactly
   - Use the correct private key (base64-encoded)

2. **"Missing signature-input header" error**
   - Always include `signature-input` in your headers and sign the listed headers

---

## License

MIT 

---

## 👤 Maintainer
- Arun — [x.com/0xarun](https://x.com/0xarun) | [linkedin.com/in/0xarun](https://linkedin.com/in/0xarun) 