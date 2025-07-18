import { Request, Response, NextFunction } from 'express';
import { verifyEd25519Signature } from './verifyEd25519Signature';
import fetch from 'node-fetch';

interface ValidateCrawlRequestOptions {
  backendUrl?: string;
}

export function validateCrawlRequest(options?: ValidateCrawlRequestOptions) {
  const backendUrl = options?.backendUrl || process.env.BACKEND_URL || 'https://botwall-api.onrender.com';

  return async function (req: Request, res: Response, next: NextFunction) {
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v[0] : v || '']));
    const userAgent = headers['user-agent'] || '';
    const crawlerId = headers['crawler-id'] || '';
    const maxPrice = parseFloat(headers['crawler-max-price'] || '0');
    const signatureInput = headers['signature-input'] || '';
    const signature = headers['signature'] || '';
    const knownBots = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'bingbot'];
    const isBot = (crawlerId && signatureInput && signature) || knownBots.some(bot => userAgent.includes(bot));
    const domain = req.hostname;
    const path = req.path;
    const now = new Date().toISOString();

    // 1. Detect crawler
    if (!isBot) {
      // Not a bot, allow normal users
      return next();
    }

    // 2. Load pricing rule from backend API
    let price = 0.01;
    let blocked = false;
    try {
      const pricingRes = await fetch(`${backendUrl}/api/sites/${encodeURIComponent(domain)}/pricing?path=${encodeURIComponent(path)}`);
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        price = Number(pricingData.price) || 0.01;
        blocked = !!pricingData.blocked;
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch pricing from backend.' });
    }
    if (blocked) {
      logCrawl(crawlerId, path, price, 'deny (blocked)', now);
      return res.status(403).json({ error: 'Crawler is blocked for this path.' });
    }

    // 3. Fetch bot's public key from backend API
    let publicKey: string | null = null;
    try {
      const pkRes = await fetch(`${backendUrl}/api/bots/${encodeURIComponent(crawlerId)}/public-key`);
      if (pkRes.ok) {
        const pkData = await pkRes.json();
        publicKey = pkData.publicKey || null;
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch public key from backend.' });
    }
    if (!publicKey) {
      logCrawl(crawlerId, path, price, 'deny (no public key)', now);
      return res.status(403).json({ error: 'Could not fetch crawler public key.' });
    }

    // 4. Verify signature
    const validSig = verifyEd25519Signature(headers, signature, publicKey);
    if (!validSig) {
      logCrawl(crawlerId, path, price, 'deny (invalid signature)', now);
      return res.status(403).json({ error: 'Invalid signature.' });
    }

    // 5. Price negotiation
    if (maxPrice < price) {
      res.setHeader('pay-per-crawl-price', price.toString());
      logCrawl(crawlerId, path, price, 'deny (price too low)', now);
      return res.status(402).json({ error: 'Price too low for this crawl.', requiredPrice: price });
    }

    // 6. Allow
    try {
      // Call backend to deduct credits and log crawl
      const recordRes = await fetch(`${backendUrl}/api/crawls/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crawlerId,
          domain,
          path,
          userAgent
        })
      });
      if (!recordRes.ok) {
        const err = await recordRes.json();
        if (recordRes.status === 402) {
          logCrawl(crawlerId, path, price, 'deny (insufficient credits)', now);
          return res.status(402).json({ error: 'Insufficient credits' });
        }
        logCrawl(crawlerId, path, price, 'deny (backend error)', now);
        return res.status(500).json({ error: 'Failed to record crawl' });
      }
    } catch (err) {
      logCrawl(crawlerId, path, price, 'deny (backend error)', now);
      return res.status(500).json({ error: 'Failed to record crawl' });
    }
    logCrawl(crawlerId, path, price, 'allow', now);
    return next();
  };
}

// --- Helper: Log every request ---
function logCrawl(crawlerId: string, url: string, price: number, decision: string, timestamp: string) {
  // TODO: Replace with real logging (e.g., to a database or logging service)
  console.log(`[${timestamp}] crawler-id=${crawlerId} url=${url} price=${price} decision=${decision}`);
} 