# BotWall SDK

The BotWall SDK allows bot developers to interact with pay-per-crawl protected APIs.


## Example Usage

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

## Usage Summary

| Usage Style                | How to Pass Backend URL                | Example                                 |
|----------------------------|----------------------------------------|-----------------------------------------|
| SDK Client (recommended)   | Constructor param                      | `new BotWallClient('https://.../api')`  |
| Single-call helper         | Option param `{ apiUrl: ... }`         | `sendCrawlRequest(..., { apiUrl: ... })`|
| .env (fallback)            | `BACKEND_URL` in .env                  |                                         |

## Notes
- Passing the backend API URL explicitly is recommended for production and when deploying to multiple environments.
- If you do not pass a URL, the SDK will use `process.env.BACKEND_URL` if available.
- For local development, set `BACKEND_URL=http://localhost:3001/api` in your `.env` file.

## Installation

```bash
npm install @botwall/sdk
```

## Quick Start

### For Site Owners

Protect your routes and monetize bot access:


### For Bot Developers (Ed25519 Signature Flow)

Bot developers can use the SDK to:
- Generate an Ed25519 keypair (public/private key)
- Sign requests to protected endpoints using their private key
- (Optionally) Send signed crawl requests with fetch


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