import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { authenticateToken, requireSiteOwner, requireBotDeveloper } from '../middleware/auth';
import { getBrowserFilterSQL } from '../utils/browserFilter';

const router = Router();

/**
 * @route GET /api/crawls/site-owner
 * @desc Get crawls for sites owned by the authenticated user
 * @access private (site_owner)
 * @returns {Object[]} Array of crawl objects
 * @error 500 - Internal server error
 */
router.get('/site-owner', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Get browser filter parameter
    const excludeBrowsers = req.query.excludeBrowsers !== 'false'; // Default to true
    
    // Get browser filter SQL
    const browserFilter = getBrowserFilterSQL(excludeBrowsers);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT c.id FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        JOIN sites s ON c.site_id = s.id
        WHERE s.owner_id = $1 ${browserFilter}
        UNION ALL
        SELECT bcl.id FROM bot_crawl_logs bcl
        JOIN sites s ON bcl.site_id = s.id
        WHERE s.owner_id = $1 ${browserFilter}
      ) as combined_crawls
    `;
    
    const countResult = await queryOne(countQuery, [req.user!.id]);
    const total = parseInt(countResult.total);
    
    // Query both crawls and bot_crawl_logs tables with pagination and filtering
    const crawls = await query(`
      SELECT 
        c.id,
        c.bot_id,
        c.site_id,
        c.status,
        c.path,
        c.user_agent,
        c.timestamp,
        b.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1 ${browserFilter}
      UNION ALL
      SELECT 
        bcl.id,
        bcl.bot_id,
        bcl.site_id,
        bcl.status,
        bcl.path,
        bcl.user_agent,
        bcl.timestamp,
        bcl.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM bot_crawl_logs bcl
      JOIN sites s ON bcl.site_id = s.id
      WHERE s.owner_id = $1 ${browserFilter}
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `, [req.user!.id, limit, offset]);
    
    res.json({
      message: 'Crawls fetched successfully.',
      crawls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        excludeBrowsers
      }
    });
  } catch (error) {
    console.error('Get site crawls error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch crawls.'
    });
  }
});

/**
 * @route GET /api/crawls/bot-developer
 * @desc Get crawls for bots owned by the authenticated developer
 * @access private (bot_developer)
 * @returns {Object[]} Array of crawl objects
 * @error 500 - Internal server error
 */
router.get('/bot-developer', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Get browser filter parameter
    const excludeBrowsers = req.query.excludeBrowsers !== 'false'; // Default to true
    
    // Get browser filter SQL
    const browserFilter = getBrowserFilterSQL(excludeBrowsers);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT c.id FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        JOIN sites s ON c.site_id = s.id
        WHERE b.developer_id = $1 ${browserFilter}
        UNION ALL
        SELECT bcl.id FROM bot_crawl_logs bcl
        JOIN sites s ON bcl.site_id = s.id
        JOIN bots b ON bcl.bot_id = b.id
        WHERE b.developer_id = $1 AND bcl.bot_id IS NOT NULL ${browserFilter}
      ) as combined_crawls
    `;
    
    const countResult = await queryOne(countQuery, [req.user!.id]);
    const total = parseInt(countResult.total);
    
    // Query both crawls and bot_crawl_logs tables with pagination and filtering
    const crawls = await query(`
      SELECT 
        c.id,
        c.bot_id,
        c.site_id,
        c.status,
        c.path,
        c.user_agent,
        c.timestamp,
        b.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      JOIN sites s ON c.site_id = s.id
      WHERE b.developer_id = $1 ${browserFilter}
      UNION ALL
      SELECT 
        bcl.id,
        bcl.bot_id,
        bcl.site_id,
        bcl.status,
        bcl.path,
        bcl.user_agent,
        bcl.timestamp,
        bcl.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM bot_crawl_logs bcl
      JOIN sites s ON bcl.site_id = s.id
      JOIN bots b ON bcl.bot_id = b.id
      WHERE b.developer_id = $1 AND bcl.bot_id IS NOT NULL ${browserFilter}
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `, [req.user!.id, limit, offset]);
    
    res.json({
      message: 'Crawls fetched successfully.',
      crawls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        excludeBrowsers
      }
    });
  } catch (error) {
    console.error('Get bot crawls error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch crawls.'
    });
  }
});

// Get crawl statistics for site owners
router.get('/stats/site-owner', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    // Get aggregated stats from sites table
    const stats = await query(`
      SELECT 
        SUM(total_requests) as total_requests,
        SUM(successful_requests) as successful_requests,
        SUM(total_earnings) as total_earnings
      FROM sites 
      WHERE owner_id = $1
    `, [req.user!.id]);

    const totalRequests = Number(stats[0]?.total_requests || 0);
    const successfulRequests = Number(stats[0]?.successful_requests || 0);
    const totalEarnings = Number(stats[0]?.total_earnings || 0);
    const failedRequests = totalRequests - successfulRequests; // Calculate failed as difference

    res.json({
      totalCrawls: totalRequests,
      successfulCrawls: successfulRequests,
      failedCrawls: failedRequests,
      blockedCrawls: 0, // We can add blocked counter later if needed
      totalEarnings: totalEarnings
    });
  } catch (error) {
    console.error('Get site stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics.'
    });
  }
});

// Get crawl statistics for bot developers
router.get('/stats/bot-developer', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    // Get aggregated stats from bots table
    const stats = await query(`
      SELECT 
        SUM(total_requests) as total_requests,
        SUM(successful_requests) as successful_requests
      FROM bots 
      WHERE developer_id = $1
    `, [req.user!.id]);

    const totalRequests = Number(stats[0]?.total_requests || 0);
    const successfulRequests = Number(stats[0]?.successful_requests || 0);
    const failedRequests = totalRequests - successfulRequests; // Calculate failed as difference

    res.json({
      totalCrawls: totalRequests,
      successfulCrawls: successfulRequests,
      failedCrawls: failedRequests,
      blockedCrawls: 0 // We can add blocked counter later if needed
    });
  } catch (error) {
    console.error('Get bot stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics.'
    });
  }
});

// --- PUBLIC: Record a crawl from middleware (signature-based flow) ---
router.post('/record', async (req: Request, res: Response) => {
  try {
    const { crawlerId, domain, path, userAgent } = req.body;
    if (!crawlerId || !domain || !path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Find bot
    const bot = await queryOne('SELECT * FROM bots WHERE bot_id = $1', [crawlerId]);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    // Find site
    const site = await queryOne('SELECT * FROM sites WHERE domain = $1', [domain]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    // Check credits
    if (bot.credits < 1) {
      // Log failed crawl
      await query(
        'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())',
        [bot.id, site.id, 'failed', path, userAgent]
      );
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    // Deduct 1 credit
    await query('UPDATE bots SET credits = credits - 1, updated_at = now() WHERE id = $1', [bot.id]);
    // Log successful crawl
    await query(
      'INSERT INTO crawls (id, bot_id, site_id, status, path, user_agent, timestamp) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())',
      [bot.id, site.id, 'success', path, userAgent]
    );
    res.json({ success: true, remainingCredits: bot.credits - 1 });
  } catch (error) {
    console.error('Record crawl error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 