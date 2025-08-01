import { Request, Response, NextFunction } from 'express';
import { verifyEd25519Signature } from './verifyEd25519Signature';
import fetch from 'node-fetch';

interface ValidateCrawlRequestOptions {
  backendUrl?: string;
}

// --- Known bots cache ---
let knownBotsCache: Array<any> = [];
let knownBotsCacheTimestamp = 0;
const KNOWN_BOTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getKnownBots(backendUrl: string) {
  const now = Date.now();
  if (knownBotsCache.length && now - knownBotsCacheTimestamp < KNOWN_BOTS_CACHE_TTL) {
    return knownBotsCache;
  }
  try {
    const res = await fetch(`${backendUrl}/api/known-bots`);
    if (res.ok) {
      knownBotsCache = await res.json();
      knownBotsCacheTimestamp = now;
      return knownBotsCache;
    }
  } catch (err) {
    // Fallback to last cache
    if (knownBotsCache.length) return knownBotsCache;
    return [];
  }
  return [];
}

// --- Site bot preferences cache (per site) ---
const siteBotPrefsCache: Record<string, { prefs: any[]; ts: number }> = {};
const SITE_PREFS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
async function getSiteBotPrefs(backendUrl: string, siteId: string) {
  const now = Date.now();
  if (siteBotPrefsCache[siteId] && now - siteBotPrefsCache[siteId].ts < SITE_PREFS_CACHE_TTL) {
    return siteBotPrefsCache[siteId].prefs;
  }
  try {
    const res = await fetch(`${backendUrl}/api/sites/${siteId}/bot-prefs`);
    if (res.ok) {
      const prefs = await res.json();
      siteBotPrefsCache[siteId] = { prefs, ts: now };
      return prefs;
    }
  } catch (err) {
    if (siteBotPrefsCache[siteId]) return siteBotPrefsCache[siteId].prefs;
    return [];
  }
  return [];
}

// --- Site lookup cache (per domain) ---
const siteCache: Record<string, { siteId: string; ts: number }> = {};
const SITE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSiteByDomain(backendUrl: string, domain: string) {
  const now = Date.now();
  if (siteCache[domain] && now - siteCache[domain].ts < SITE_CACHE_TTL) {
    return siteCache[domain].siteId;
  }
  try {
    const res = await fetch(`${backendUrl}/api/sites/domain/${encodeURIComponent(domain)}`);
    if (res.ok) {
      const data = await res.json();
      siteCache[domain] = { siteId: data.site_id, ts: now };
      return data.site_id;
    }
  } catch (err) {
    // Fallback to cached value if available
    if (siteCache[domain]) return siteCache[domain].siteId;
  }
  return null;
}

// --- Bot classification helper ---
function classifyBot(headers: Record<string, string>, userAgent: string, knownBots: any[]) {
  // Signed bot: has crawler-id, signature-input, signature
  if (headers['crawler-id'] && headers['signature-input'] && headers['signature']) {
    return { type: 'signed', knownBot: null };
  }
  // Known bot: match user-agent
  for (const bot of knownBots) {
    try {
      if (bot.user_agent_pattern && new RegExp(bot.user_agent_pattern, 'i').test(userAgent)) {
        return { type: 'known', knownBot: bot };
      }
    } catch (e) {
      // fallback to includes
      if (userAgent.includes(bot.user_agent_pattern)) {
        return { type: 'known', knownBot: bot };
      }
    }
  }
  // Unknown bot
  return { type: 'unknown', knownBot: null };
}

export function validateCrawlRequest(options?: ValidateCrawlRequestOptions) {
  const backendUrl = options?.backendUrl || process.env.BACKEND_URL || 'http://localhost:3000';

  return async function (req: Request, res: Response, next: NextFunction) {
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v[0] : v || '']));
    const userAgent = headers['user-agent'] || '';
    const crawlerId = headers['crawler-id'] || '';
    const maxPrice = parseFloat(headers['crawler-max-price'] || '0');
    const signatureInput = headers['signature-input'] || '';
    const signature = headers['signature'] || '';
    // Extract domain with fallbacks for different environments
    let domain = '';
    if (req.hostname) {
      domain = req.hostname.split(':')[0];
    } else if (req.headers.host) {
      const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
      domain = host.split(':')[0];
    } else if (req.headers['x-forwarded-host']) {
      const forwardedHost = Array.isArray(req.headers['x-forwarded-host']) ? req.headers['x-forwarded-host'][0] : req.headers['x-forwarded-host'];
      domain = forwardedHost.split(':')[0];
    } else {
      // Fallback for edge functions or environments without hostname
      domain = 'unknown';
    }
    const path = req.path;
    const now = new Date().toISOString();
    const ip = req.ip || req.connection?.remoteAddress || '';

    console.log(`🔍 Middleware: Processing request for domain: ${domain}`);

    // --- 1. Check if this is a signed bot request ---
    const isSignedBot = crawlerId && signatureInput && signature;
    
    if (isSignedBot) {
      console.log(`🔍 Middleware: Signed bot detected: ${crawlerId}`);
      
      // For signed bots, use the original workflow
      // 1. Fetch public key
      let publicKey: string | null = null;
      try {
        const pkRes = await fetch(`${backendUrl}/api/bots/${encodeURIComponent(crawlerId)}/public-key`);
        if (pkRes.ok) {
          const pkData = await pkRes.json();
          publicKey = pkData.publicKey || null;
        }
      } catch (err) {
        console.log(`❌ Middleware: Failed to fetch public key for ${crawlerId}`);
        return res.status(500).json({ error: 'Failed to fetch public key from backend.' });
      }
      
      if (!publicKey) {
        console.log(`❌ Middleware: No public key found for ${crawlerId}`);
        return res.status(403).send(`This content is protected by BotWall pay-per-crawl system
Bots must pay to access this content. Check BotWall.`);
      }

      // 2. Verify signature
      const validSig = verifyEd25519Signature(headers, signature, publicKey);
      if (!validSig) {
        console.log(`❌ Middleware: Invalid signature for ${crawlerId}`);
        return res.status(403).send(`This content is protected by BotWall pay-per-crawl system
Bots must pay to access this content. Check BotWall.`);
      }

      // 3. Call original verify endpoint (this handles credits, site lookup, etc.)
      try {
        const verifyRes = await fetch(`${backendUrl}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: crawlerId,
            botApiKey: '', // Empty for signed bots
            path: path,
            userAgent: userAgent,
            domain: domain // Pass domain for site lookup
          })
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          if (verifyRes.status === 402) {
            console.log(`❌ Middleware: Insufficient credits for ${crawlerId}`);
            return res.status(402).send(`This content is protected by BotWall pay-per-crawl system
Bots must pay to access this content. Check BotWall.`);
          }
          console.log(`❌ Middleware: Verification failed for ${crawlerId}`);
          return res.status(verifyRes.status).send(`This content is protected by BotWall pay-per-crawl system
Bots must pay to access this content. Check BotWall.`);
        }

        // Note: Signed bots are logged to 'crawls' table by the verify endpoint
        // No need to duplicate log to bot_crawl_logs

        console.log(`✅ Middleware: Signed bot ${crawlerId} verified and allowed`);
        return next();
      } catch (err) {
        console.log(`❌ Middleware: Verification error for ${crawlerId}:`, err);
        return res.status(500).json({ error: 'Verification failed' });
      }
    }

    // --- 2. Handle known/unknown bots (new analytics workflow) ---
    console.log(`🔍 Middleware: Processing as known/unknown bot`);
    
    // Look up siteId by domain for known/unknown bots
    const siteId = await getSiteByDomain(backendUrl, domain);
    console.log(`🔍 Middleware: Site lookup result for ${domain}: ${siteId || 'NOT FOUND'}`);
    
    if (!siteId) {
      // Site not found for this domain, allow request but don't log
      console.log(`⚠️  Middleware: No site found for domain ${domain}, allowing request without logging`);
      return next();
    }

    // Fetch known bots
    const knownBots = await getKnownBots(backendUrl);
    const { type, knownBot } = classifyBot(headers, userAgent, knownBots);
    console.log(`🔍 Middleware: Bot classified as ${type}${knownBot ? ` (${knownBot.name})` : ''}`);

    // For known bots, check site-specific block/allow
    if (type === 'known' && knownBot) {
      const prefs = await getSiteBotPrefs(backendUrl, siteId);
      const pref = prefs.find((p: any) => p.known_bot_id === knownBot.id);
      
      if (pref && pref.blocked) {
        console.log(`🚫 Middleware: Blocking ${knownBot.name} for site ${siteId}`);
        await logBotCrawl({
          backendUrl, siteId, userAgent, botName: knownBot.name, path, status: 'blocked', ip, knownBotId: knownBot.id, headers
        });
        return res.status(403).send(`This content is protected by BotWall pay-per-crawl system
Bots must pay to access this content. Check BotWall.`);
      }
    }

    // Log and allow the request
    if (type === 'known' && knownBot) {
      console.log(`✅ Middleware: Known bot ${knownBot.name} allowed for site ${siteId}`);
      await logBotCrawl({
        backendUrl, siteId, userAgent, botName: knownBot.name, path, status: 'success', ip, knownBotId: knownBot.id, headers
      });
    } else {
      console.log(`✅ Middleware: Unknown bot allowed for site ${siteId}`);
      await logBotCrawl({
        backendUrl, siteId, userAgent, botName: userAgent || 'Unknown', path, status: 'success', ip, headers
      });
    }
    
    return next();
  };
}

// --- Helper: Log every crawl to backend ---
async function logBotCrawl({ backendUrl, siteId, userAgent, botName, path, status, ip, botId, knownBotId, headers }: any) {
  try {
    await fetch(`${backendUrl}/api/bot-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: siteId,
        bot_id: botId,
        known_bot_id: knownBotId,
        user_agent: userAgent,
        bot_name: botName,
        path,
        status,
        ip_address: ip,
        raw_headers: headers
      })
    });
  } catch (err) {
    // Fallback: log to console
    console.log(`[${new Date().toISOString()}] Failed to log bot crawl:`, err);
  }
} 