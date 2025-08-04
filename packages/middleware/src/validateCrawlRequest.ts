import { Request, Response, NextFunction } from 'express';
import { verifyEd25519Signature } from './verifyEd25519Signature';
import fetch from 'node-fetch';

export interface ValidateCrawlRequestOptions {
  backendUrl?: string;
  siteId?: string;
  monetizedRoutes?: string[];
  pricePerCrawl?: number;
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

// --- Unknown bot preferences cache (per site) ---
const siteUnknownBotPrefsCache: Record<string, { prefs: any[]; ts: number }> = {};
const SITE_UNKNOWN_PREFS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

async function getSiteUnknownBotPrefs(backendUrl: string, siteId: string) {
  const now = Date.now();
  if (siteUnknownBotPrefsCache[siteId] && now - siteUnknownBotPrefsCache[siteId].ts < SITE_UNKNOWN_PREFS_CACHE_TTL) {
    return siteUnknownBotPrefsCache[siteId].prefs;
  }
  try {
    const res = await fetch(`${backendUrl}/api/sites/${siteId}/unknown-bot-prefs`);
    if (res.ok) {
      const prefs = await res.json();
      siteUnknownBotPrefsCache[siteId] = { prefs, ts: now };
      return prefs;
    }
  } catch (err) {
    if (siteUnknownBotPrefsCache[siteId]) return siteUnknownBotPrefsCache[siteId].prefs;
    return [];
  }
  return [];
}

async function discoverUnknownBot(backendUrl: string, userAgent: string, botName: string) {
  try {
    await fetch(`${backendUrl}/api/unknown-bot-discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_agent: userAgent, bot_name: botName })
    });
  } catch (err) {
    console.log(`❌ Middleware: Failed to discover unknown bot:`, err);
  }
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

// --- Site configuration cache (per site ID) ---
const siteConfigCache: Record<string, { config: any; ts: number }> = {};
const SITE_CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSiteConfig(backendUrl: string, siteId: string, hostname: string) {
  const now = Date.now();
  const cacheKey = `${siteId}:${hostname}`;
  
  if (siteConfigCache[cacheKey] && now - siteConfigCache[cacheKey].ts < SITE_CONFIG_CACHE_TTL) {
    return siteConfigCache[cacheKey].config;
  }
  
  try {
    const res = await fetch(`${backendUrl}/api/sites/config/${siteId}?hostname=${encodeURIComponent(hostname)}`);
    if (res.ok) {
      const config = await res.json();
      siteConfigCache[cacheKey] = { config, ts: now };
      return config;
    }
  } catch (err) {
    if (siteConfigCache[cacheKey]) return siteConfigCache[cacheKey].config;
  }
  return null;
}

// --- Route matching helper ---
function isMonetizedRoute(path: string, monetizedRoutes: string[]): boolean {
  for (const route of monetizedRoutes) {
    // Convert glob pattern to regex
    const pattern = route
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*')   // Convert * to .*
      .replace(/\?/g, '\\.')  // Convert ? to .
      .replace(/\[/g, '\\[')  // Escape brackets
      .replace(/\]/g, '\\]');
    
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return true;
    }
  }
  return false;
}

// --- Bot detection helper ---
function isBotRequest(userAgent: string): boolean {
  // Specific bot patterns that won't catch regular browsers
  // Using word boundaries (\b) to avoid matching "bot" in "robot" or other words
  const botPatterns = [
    /bot\b/i, /crawler\b/i, /spider\b/i, /scraper\b/i, /gptbot/i, /chatgpt/i, /claude/i, /anthropic/i,
    /bingbot/i, /googlebot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegrambot/i,
    /curl/i, /wget/i, /python/i, /requests/i, /scrapy/i, /selenium/i, /puppeteer/i, /playwright/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

// --- Bot name extraction helper ---
function getBotName(userAgent: string): string {
  const knownBots = [
    { pattern: /gptbot/i, name: 'GPTBot' },
    { pattern: /chatgpt/i, name: 'ChatGPT' },
    { pattern: /claude/i, name: 'Claude' },
    { pattern: /anthropic/i, name: 'Anthropic' },
    { pattern: /bingbot/i, name: 'BingBot' },
    { pattern: /googlebot/i, name: 'GoogleBot' },
    { pattern: /slurp/i, name: 'Yahoo Slurp' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /baiduspider/i, name: 'BaiduSpider' },
    { pattern: /yandexbot/i, name: 'YandexBot' },
    { pattern: /facebookexternalhit/i, name: 'Facebook' },
    { pattern: /twitterbot/i, name: 'TwitterBot' },
    { pattern: /linkedinbot/i, name: 'LinkedInBot' },
    { pattern: /whatsapp/i, name: 'WhatsApp' },
    { pattern: /telegrambot/i, name: 'TelegramBot' }
  ];
  
  for (const bot of knownBots) {
    if (bot.pattern.test(userAgent)) {
      return bot.name;
    }
  }
  
  return userAgent || 'Unknown Bot';
}

// --- Bot classification helper ---
async function classifyBot(headers: Record<string, string>, userAgent: string, knownBots: any[], backendUrl: string) {
  // Signed bot: has crawler-id, signature-input, signature
  if (headers['crawler-id'] && headers['signature-input'] && headers['signature']) {
    return { type: 'signed', knownBot: null };
  }
  
  // Check if this is a registered signed bot (by user agent or bot name)
  try {
    const registeredBotRes = await fetch(`${backendUrl}/api/bots/check-registered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_agent: userAgent })
    });
    
    if (registeredBotRes.ok) {
      const botData = await registeredBotRes.json();
      if (botData.is_registered) {
        return { type: 'registered_signed', knownBot: null, botData: botData };
      }
    }
  } catch (err) {
    console.log(`❌ Middleware: Failed to check registered bot status:`, err);
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
  const backendUrl = options?.backendUrl || process.env.BACKEND_URL || 'https://botwall-api.onrender.com';
  const configSiteId = options?.siteId;
  const configMonetizedRoutes = options?.monetizedRoutes || ['/*'];
  const configPricePerCrawl = options?.pricePerCrawl || 0.01;

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

    // --- EARLY EXIT: Allow regular browsers to pass through immediately ---
    const isSignedBot = crawlerId && signatureInput && signature;
    const isActualBot = isBotRequest(userAgent);
    
    // If it's not a signed bot and not an actual bot, allow it immediately
    if (!isSignedBot && !isActualBot) {
      console.log(`✅ Middleware: Regular browser detected, allowing access: ${userAgent}`);
      return next();
    }

    // --- 0. Site ID-based validation (new system) ---
    if (configSiteId) {
      console.log(`🔍 Middleware: Using site ID-based validation: ${configSiteId}`);
      
      try {
        // Get site configuration from database
        const siteConfig = await getSiteConfig(backendUrl, configSiteId, domain);
        
        if (!siteConfig) {
          console.log(`❌ Middleware: Site configuration not found for site ID: ${configSiteId}`);
          return res.status(403).send('Domain not authorized');
        }
        
        // Verify domain authorization
        if (siteConfig.frontendDomain !== domain && siteConfig.backendDomain !== domain) {
          console.log(`❌ Middleware: Domain ${domain} not authorized for site ID: ${configSiteId}`);
          return res.status(403).send('Domain not authorized');
        }
        
        // Always record analytics for bot requests
        if (isBotRequest(userAgent)) {
          await logBotCrawl({
            backendUrl, 
            siteId: siteConfig.siteId, 
            userAgent, 
            botName: getBotName(userAgent), 
            path, 
            status: 'success', 
            ip, 
            headers
          });
        }
        
        // Check if this is a monetized route
        const monetizedRoutes = siteConfig.monetizedRoutes || configMonetizedRoutes;
        if (isMonetizedRoute(path, monetizedRoutes)) {
          console.log(`💰 Middleware: Monetized route detected: ${path}`);
          
          // For signed bots, use existing verification
          if (crawlerId && signatureInput && signature) {
            // Continue with signed bot verification
            console.log(`🔍 Middleware: Signed bot on monetized route: ${crawlerId}`);
          } else {
            // For unsigned bots, block access to monetized routes
            console.log(`🚫 Middleware: Blocking unsigned bot on monetized route: ${path}`);
            return res.status(402).send('Insufficient credits - Please purchase credits to access this API');
          }
        } else {
          console.log(`✅ Middleware: Non-monetized route, allowing access: ${path}`);
          return next();
        }
      } catch (error) {
        console.error(`❌ Middleware: Error in site ID validation:`, error);
        // Fallback to allow request
        return next();
      }
    }

    // --- 1. Check if this is a signed bot request ---
    if (isSignedBot) {
      console.log(`🔍 Middleware: Signed bot detected: ${crawlerId}`);
      
      // For signed bots, use the original workflow
      // 1. Fetch public key
      let publicKey: string | null = null;
      try {
        const publicKeyUrl = `${backendUrl}/api/bots/${encodeURIComponent(crawlerId)}/public-key`;
        console.log(`🔍 Middleware: Fetching public key from: ${publicKeyUrl}`);
        
        const pkRes = await fetch(publicKeyUrl);
        console.log(`🔍 Middleware: Public key response status: ${pkRes.status}`);
        
        if (pkRes.ok) {
          const pkData = await pkRes.json();
          console.log(`🔍 Middleware: Public key response data:`, pkData);
          publicKey = pkData.publicKey || null;
        } else {
          const errorText = await pkRes.text();
          console.log(`❌ Middleware: Public key fetch failed with status ${pkRes.status}: ${errorText}`);
        }
      } catch (err) {
        console.log(`❌ Middleware: Failed to fetch public key for ${crawlerId}:`, err);
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
    const { type, knownBot, botData } = await classifyBot(headers, userAgent, knownBots, backendUrl);
    console.log(`🔍 Middleware: Bot classified as ${type}${knownBot ? ` (${knownBot.name})` : ''}`);

    // Handle registered signed bots without proper headers
    if (type === 'registered_signed') {
      console.log(`🔍 Middleware: Registered signed bot detected without proper headers: ${userAgent}`);
      return res.status(401).send(`🔐 Authentication Required - BotWall Protection

This content is protected by BotWall's pay-per-crawl system.

Your bot "${botData?.bot_name || userAgent}" is registered but missing required authentication headers.

Required headers:
- crawler-id: Your bot ID
- signature-input: Request signature input
- signature: Ed25519 signature

Please include these headers in your request to access this content.

For more information, visit: https://botwall.com`);
    }

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

    // Handle unknown bots - BLOCK BY DEFAULT (these are likely scrapers/crawlers)
    if (type === 'unknown') {
      console.log(`🔍 Middleware: Unknown bot detected: ${userAgent}`);
      
      // Discover/register the unknown bot
      await discoverUnknownBot(backendUrl, userAgent, getBotName(userAgent));
      
      // Check site-specific preferences for this unknown bot
      const unknownBotPrefs = await getSiteUnknownBotPrefs(backendUrl, siteId);
      const unknownBotPref = unknownBotPrefs.find((p: any) => p.user_agent === userAgent);
      
      // Default to blocked unless explicitly allowed
      const shouldBlock = !unknownBotPref || unknownBotPref.blocked;
      
      if (shouldBlock) {
        console.log(`🚫 Middleware: Blocking unknown bot for site ${siteId}: ${userAgent}`);
        await logBotCrawl({
          backendUrl, siteId, userAgent, botName: getBotName(userAgent), path, status: 'blocked', ip, headers
        });
        return res.status(403).send(`🚫 Access Denied - BotWall Protection Active

This content is protected by BotWall's pay-per-crawl system.

Unauthorized bots are not allowed to scrape this content.
To access this content, you need to:
1. Register your bot at https://botwall.com
2. Purchase credits for crawling
3. Use proper authentication headers

For more information, visit: https://botwall.com`);
      } else {
        console.log(`✅ Middleware: Unknown bot allowed by site preference for site ${siteId}: ${userAgent}`);
        await logBotCrawl({
          backendUrl, siteId, userAgent, botName: getBotName(userAgent), path, status: 'success', ip, headers
        });
        return next();
      }
    }

    // Log and allow known bots
    if (type === 'known' && knownBot) {
      console.log(`✅ Middleware: Known bot ${knownBot.name} allowed for site ${siteId}`);
      await logBotCrawl({
        backendUrl, siteId, userAgent, botName: knownBot.name, path, status: 'success', ip, knownBotId: knownBot.id, headers
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