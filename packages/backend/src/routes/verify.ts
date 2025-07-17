import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { generateCrawlId } from '../utils/generators';

const router = Router();

// Core verification endpoint - validates bot and site, checks credits, deducts 1 credit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { botId, botApiKey, siteId, path, userAgent } = req.body;
    // Validate required fields
    if (!botId || !botApiKey || !siteId || !path) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'botId, botApiKey, siteId, and path are required'
      });
    }
    // 1. Validate site
    const site = await queryOne(
      'SELECT * FROM sites WHERE id = $1',
      [siteId]
    );
    if (!site) {
      return res.status(401).json({
        error: 'Invalid site credentials',
        message: 'Site ID is incorrect'
      });
    }
    // 2. Validate bot
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
    // 3. Check if bot has enough credits
    if (bot.credits < 1) {
      // Log failed crawl due to insufficient credits
      const crawlId = generateCrawlId();
      await query(
        'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5, $6, now())',
        [crawlId, bot.id, site.id, 'failed', path, userAgent]
      );
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Insufficient credits to perform this crawl',
        remainingCredits: bot.credits
      });
    }
    // 4. Deduct 1 credit from bot
    await query(
      'UPDATE bots SET credits = credits - 1, updated_at = now() WHERE id = $1',
      [bot.id]
    );
    // 5. Log successful crawl
    const crawlId = generateCrawlId();
    await query(
      'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5, $6, now())',
      [crawlId, bot.id, site.id, 'success', path, userAgent]
    );
    // 6. Return success response
    res.json({
      success: true,
      status: 200,
      message: 'Verification successful',
      crawlData: {
        botId: bot.bot_id,
        siteId: site.id,
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