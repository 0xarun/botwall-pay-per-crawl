import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { authenticateToken, requireSiteOwner, requireBotDeveloper } from '../middleware/auth';

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
    const crawls = await query(`
      SELECT 
        c.*,
        b.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1
      ORDER BY c.timestamp DESC
      LIMIT 100
    `, [req.user!.id]);
    res.json({
      message: 'Crawls fetched successfully.',
      crawls
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
    const crawls = await query(`
      SELECT 
        c.*,
        b.bot_name,
        s.name as site_name,
        s.domain as site_domain
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      JOIN sites s ON c.site_id = s.id
      WHERE b.developer_id = $1
      ORDER BY c.timestamp DESC
      LIMIT 100
    `, [req.user!.id]);
    res.json({
      message: 'Crawls fetched successfully.',
      crawls
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
    // Total crawls
    const totalCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1
    `, [req.user!.id]);

    // Successful crawls
    const successfulCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1 AND c.status = 'success'
    `, [req.user!.id]);

    // Failed crawls
    const failedCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1 AND c.status = 'failed'
    `, [req.user!.id]);

    // Blocked crawls
    const blockedCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1 AND c.status = 'blocked'
    `, [req.user!.id]);

    // Total earnings: sum price_per_crawl * successful crawls per site
    const earningsRows = await query(`
      SELECT s.price_per_crawl, COUNT(c.id) as crawl_count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.owner_id = $1 AND c.status = 'success'
      GROUP BY s.id, s.price_per_crawl
    `, [req.user!.id]);
    let totalEarnings = 0;
    for (const row of earningsRows) {
      totalEarnings += Number(row.price_per_crawl) * Number(row.crawl_count);
    }

    res.json({
      totalCrawls: totalCrawls[0]?.count || 0,
      successfulCrawls: successfulCrawls[0]?.count || 0,
      failedCrawls: failedCrawls[0]?.count || 0,
      blockedCrawls: blockedCrawls[0]?.count || 0,
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
    const totalCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.developer_id = $1
    `, [req.user!.id]);

    const successfulCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.developer_id = $1 AND c.status = 'success'
    `, [req.user!.id]);

    const failedCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.developer_id = $1 AND c.status = 'failed'
    `, [req.user!.id]);

    const blockedCrawls = await query(`
      SELECT COUNT(*) as count
      FROM crawls c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.developer_id = $1 AND c.status = 'blocked'
    `, [req.user!.id]);

    res.json({
      totalCrawls: totalCrawls[0]?.count || 0,
      successfulCrawls: successfulCrawls[0]?.count || 0,
      failedCrawls: failedCrawls[0]?.count || 0,
      blockedCrawls: blockedCrawls[0]?.count || 0
    });
  } catch (error) {
    console.error('Get bot stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics.'
    });
  }
});

// Record a crawl from middleware (signature-based flow)
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