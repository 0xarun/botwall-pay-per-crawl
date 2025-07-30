import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { generateCrawlId } from '../utils/generators';

const router = Router();

// Core verification endpoint - validates bot and site, checks credits, deducts 1 credit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { botId, botApiKey, siteId, path, userAgent, domain } = req.body;
    
    // Validate required fields
    if (!botId || !path) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'botId and path are required'
      });
    }

    // Check if this is a signed bot request (from middleware) or manual API call
    const isSignedBotRequest = !botApiKey || botApiKey === '';
    
    let bot;
    if (isSignedBotRequest) {
      // For signed bots, validate by bot_id only (signature already verified by middleware)
      bot = await queryOne(
        'SELECT * FROM bots WHERE bot_id = $1',
        [botId]
      );
    } else {
      // For manual API calls, require both bot_id and api_key
      if (!botApiKey) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'botApiKey is required for manual API calls'
        });
      }
      bot = await queryOne(
        'SELECT * FROM bots WHERE bot_id = $1 AND api_key = $2',
        [botId, botApiKey]
      );
    }

    if (!bot) {
      return res.status(401).json({
        error: 'Invalid bot credentials',
        message: 'Bot ID is incorrect'
      });
    }

    // Get site information
    let site = null;
    if (siteId) {
      // Site ID provided directly
      site = await queryOne(
        'SELECT * FROM sites WHERE id = $1',
        [siteId]
      );
    } else if (domain) {
      // Look up site by domain (for signed bots from middleware)
      site = await queryOne(
        'SELECT * FROM sites WHERE domain = $1',
        [domain]
      );
    }

    // For signed bots, we MUST have site info for proper logging
    if (isSignedBotRequest) {
      if (!site && domain) {
        return res.status(404).json({
          error: 'Site not found',
          message: `No site registered for domain: ${domain}`
        });
      }
      if (!site) {
        return res.status(400).json({
          error: 'Site information required',
          message: 'Domain or siteId is required for signed bot requests'
        });
      }
    }

    // Check if bot has enough credits
    if (bot.credits < 1) {
      // Log failed crawl due to insufficient credits
      const crawlId = generateCrawlId();
      await query(
        'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5, $6, now())',
        [crawlId, bot.id, site?.id, 'failed', path, userAgent]
      );
      
      // Increment total requests but not successful requests
      await query(
        'UPDATE bots SET total_requests = total_requests + 1, updated_at = now() WHERE id = $1',
        [bot.id]
      );
      
      if (site) {
        await query(
          'UPDATE sites SET total_requests = total_requests + 1, updated_at = now() WHERE id = $2',
          [site.id]
        );
      }
      
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Insufficient credits to perform this crawl',
        remainingCredits: bot.credits
      });
    }

    // Deduct 1 credit from bot and increment request counters
    await query(
      'UPDATE bots SET credits = credits - 1, total_requests = total_requests + 1, successful_requests = successful_requests + 1, updated_at = now() WHERE id = $1',
      [bot.id]
    );

    // Log successful crawl
    const crawlId = generateCrawlId();
    await query(
      'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5, $6, now())',
      [crawlId, bot.id, site?.id, 'success', path, userAgent]
    );

    // Update site earnings and request counters
    if (site) {
      await query(
        'UPDATE sites SET total_earnings = total_earnings + $1, total_requests = total_requests + 1, successful_requests = successful_requests + 1, updated_at = now() WHERE id = $2',
        [site.price_per_crawl, site.id]
      );
    }

    // Return success response
    res.json({
      success: true,
      status: 200,
      message: 'Verification successful',
      crawlData: {
        botId: bot.bot_id,
        siteId: site?.id || null,
        path,
        userAgent,
        timestamp: new Date().toISOString()
      },
      remainingCredits: bot.credits - 1
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify request'
    });
  }
});

// Deduct credits endpoint (alternative to automatic deduction)
router.post('/deduct-credits', async (req: Request, res: Response) => {
  try {
    const { botId, botApiKey, creditsToDeduct = 1 } = req.body;
    if (!botId || !botApiKey || creditsToDeduct < 1) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'botId, botApiKey, and creditsToDeduct (>= 1) are required'
      });
    }
    // Validate bot
    const bot = await queryOne(
      'SELECT * FROM bots WHERE bot_id = $1 AND api_key = $2',
      [botId, botApiKey]
    );
    if (!bot) {
      return res.status(401).json({
        error: 'Invalid bot credentials',
        message: 'Bot ID or API key is incorrect'
      });
    }
    // Check if bot has enough credits
    if (bot.credits < creditsToDeduct) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: `Bot has ${bot.credits} credits but needs ${creditsToDeduct}`,
        remainingCredits: bot.credits
      });
    }
    // Deduct credits
    await query(
      'UPDATE bots SET credits = credits - $1, updated_at = now() WHERE id = $2',
      [creditsToDeduct, bot.id]
    );
    res.json({
      success: true,
      creditsDeducted: creditsToDeduct,
      remainingCredits: bot.credits - creditsToDeduct
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to deduct credits'
    });
  }
});

export default router; 