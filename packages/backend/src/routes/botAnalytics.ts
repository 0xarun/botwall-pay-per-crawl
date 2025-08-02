import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { v4 as uuidv4 } from 'uuid';
import { getBrowserFilterSQL } from '../utils/browserFilter';

const router = Router();

// GET /api/known-bots
router.get('/known-bots', async (req: Request, res: Response) => {
  try {
    const bots = await query('SELECT * FROM known_bots ORDER BY name ASC');
    res.json(bots);
  } catch (error) {
    console.error('Error fetching known bots:', error);
    res.status(500).json({ error: 'Failed to fetch known bots' });
  }
});

// POST /api/bot-logs
router.post('/bot-logs', async (req: Request, res: Response) => {
  try {
    const {
      site_id,
      bot_id,
      known_bot_id,
      user_agent,
      bot_name,
      path,
      status,
      ip_address,
      raw_headers,
      extra
    } = req.body;

    if (!site_id || !user_agent || !bot_name || !path || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO bot_crawl_logs (
        id, site_id, bot_id, known_bot_id, user_agent, bot_name, path, status, ip_address, timestamp, raw_headers, extra
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11
      )`,
      [
        id,
        site_id,
        bot_id || null,
        known_bot_id || null,
        user_agent,
        bot_name,
        path,
        status,
        ip_address || null,
        raw_headers ? JSON.stringify(raw_headers) : null,
        extra ? JSON.stringify(extra) : null
      ]
    );

    // Update site counters
    await query(
      'UPDATE sites SET total_requests = total_requests + 1, updated_at = now() WHERE id = $1',
      [site_id]
    );

    // Update successful requests counter if status is success
    if (status === 'success') {
      await query(
        'UPDATE sites SET successful_requests = successful_requests + 1, updated_at = now() WHERE id = $1',
        [site_id]
      );
    }

    // Update bot counters if bot_id is provided
    if (bot_id) {
      await query(
        'UPDATE bots SET total_requests = total_requests + 1, updated_at = now() WHERE id = $1',
        [bot_id]
      );
      
      if (status === 'success') {
        await query(
          'UPDATE bots SET successful_requests = successful_requests + 1, updated_at = now() WHERE id = $1',
          [bot_id]
        );
      }
    }

    res.status(201).json({ message: 'Log recorded' });
  } catch (error) {
    console.error('Error recording bot crawl log:', error);
    res.status(500).json({ error: 'Failed to record bot crawl log' });
  }
});

// GET /sites/:id/bot-logs
router.get('/sites/:id/bot-logs', async (req: Request, res: Response) => {
  try {
    const { id: site_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await query(
      `SELECT l.*, kb.name AS known_bot_name
       FROM bot_crawl_logs l
       LEFT JOIN known_bots kb ON l.known_bot_id = kb.id
       WHERE l.site_id = $1
       ORDER BY l.timestamp DESC
       LIMIT $2`,
      [site_id, limit]
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching bot crawl logs:', error);
    res.status(500).json({ error: 'Failed to fetch bot crawl logs' });
  }
});

// GET /sites/:id/bot-prefs
router.get('/sites/:id/bot-prefs', async (req: Request, res: Response) => {
  try {
    const { id: site_id } = req.params;
    const prefs = await query(
      `SELECT p.*, kb.name AS known_bot_name, kb.user_agent_pattern
       FROM site_bot_preferences p
       JOIN known_bots kb ON p.known_bot_id = kb.id
       WHERE p.site_id = $1`,
      [site_id]
    );
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching site bot preferences:', error);
    res.status(500).json({ error: 'Failed to fetch site bot preferences' });
  }
});

// POST /sites/:id/bot-prefs
router.post('/sites/:id/bot-prefs', async (req: Request, res: Response) => {
  try {
    const { id: site_id } = req.params;
    const { known_bot_id, blocked } = req.body;
    if (!known_bot_id || typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'known_bot_id and blocked(boolean) are required' });
    }
    // Upsert preference
    const existing = await queryOne(
      'SELECT id FROM site_bot_preferences WHERE site_id = $1 AND known_bot_id = $2',
      [site_id, known_bot_id]
    );
    if (existing) {
      await query(
        'UPDATE site_bot_preferences SET blocked = $1, updated_at = now() WHERE id = $2',
        [blocked, existing.id]
      );
    } else {
      await query(
        'INSERT INTO site_bot_preferences (site_id, known_bot_id, blocked, created_at, updated_at) VALUES ($1, $2, $3, now(), now())',
        [site_id, known_bot_id, blocked]
      );
    }
    res.json({ message: 'Preference updated' });
  } catch (error) {
    console.error('Error updating site bot preference:', error);
    res.status(500).json({ error: 'Failed to update site bot preference' });
  }
});

// GET /sites/domain/:domain
router.get('/sites/domain/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const site = await queryOne(
      'SELECT id, name, site_id, frontend_domain, backend_domain, price_per_crawl FROM sites WHERE frontend_domain = $1 OR backend_domain = $1',
      [domain]
    );
    if (!site) {
      return res.status(404).json({ error: 'Site not found for this domain' });
    }
    res.json({ 
      site_id: site.id, 
      name: site.name, 
      site_id_string: site.site_id,
      frontend_domain: site.frontend_domain,
      backend_domain: site.backend_domain,
      price_per_crawl: site.price_per_crawl
    });
  } catch (error) {
    console.error('Error looking up site by domain:', error);
    res.status(500).json({ error: 'Failed to look up site' });
  }
});

// GET /sites/site-id/:siteId - Look up site by site ID
router.get('/sites/site-id/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const site = await queryOne(
      'SELECT id, name, site_id, frontend_domain, backend_domain, price_per_crawl FROM sites WHERE site_id = $1',
      [siteId]
    );
    if (!site) {
      return res.status(404).json({ error: 'Site not found for this site ID' });
    }
    res.json({ 
      site_id: site.id, 
      name: site.name, 
      site_id_string: site.site_id,
      frontend_domain: site.frontend_domain,
      backend_domain: site.backend_domain,
      price_per_crawl: site.price_per_crawl
    });
  } catch (error) {
    console.error('Error looking up site by site ID:', error);
    res.status(500).json({ error: 'Failed to look up site' });
  }
});

// GET /analytics/overview - Comprehensive analytics overview
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7 } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Total crawls (from both tables)
    const totalCrawls = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM bot_crawl_logs WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT id FROM crawls WHERE site_id = $1 AND timestamp >= $2
      ) combined
    `, [site_id, daysAgo]);

    // Successful crawls
    const successfulCrawls = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM bot_crawl_logs WHERE site_id = $1 AND status = 'success' AND timestamp >= $2
        UNION ALL
        SELECT id FROM crawls WHERE site_id = $1 AND status = 'success' AND timestamp >= $2
      ) combined
    `, [site_id, daysAgo]);

    // Blocked crawls
    const blockedCrawls = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM bot_crawl_logs WHERE site_id = $1 AND status = 'blocked' AND timestamp >= $2
        UNION ALL
        SELECT id FROM crawls WHERE site_id = $1 AND status = 'blocked' AND timestamp >= $2
      ) combined
    `, [site_id, daysAgo]);

    // Failed crawls
    const failedCrawls = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM bot_crawl_logs WHERE site_id = $1 AND status = 'failed' AND timestamp >= $2
        UNION ALL
        SELECT id FROM crawls WHERE site_id = $1 AND status = 'failed' AND timestamp >= $2
      ) combined
    `, [site_id, daysAgo]);

    // Calculate success rate
    const total = totalCrawls[0]?.count || 0;
    const successful = successfulCrawls[0]?.count || 0;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : '0.00';

    // Calculate earnings (from crawls table only - signed bots)
    const earningsData = await query(`
      SELECT s.price_per_crawl, COUNT(c.id) as crawl_count
      FROM crawls c
      JOIN sites s ON c.site_id = s.id
      WHERE s.id = $1 AND c.status = 'success' AND c.timestamp >= $2
      GROUP BY s.price_per_crawl
    `, [site_id, daysAgo]);

    let totalEarnings = 0;
    for (const row of earningsData) {
      totalEarnings += Number(row.price_per_crawl) * Number(row.crawl_count);
    }

    res.json({
      totalCrawls: total,
      successfulCrawls: successful,
      blockedCrawls: blockedCrawls[0]?.count || 0,
      failedCrawls: failedCrawls[0]?.count || 0,
      successRate: parseFloat(successRate),
      totalEarnings: totalEarnings
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /analytics/popular-bots - Top bots by activity
router.get('/analytics/popular-bots', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7, excludeBrowsers = 'true' } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    // Get browser filter SQL
    const browserFilter = getBrowserFilterSQL(excludeBrowsers === 'true');

    const popularBots = await query(`
      SELECT 
        bot_name,
        COUNT(*) as requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests
      FROM (
        SELECT bot_name, status FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2 ${browserFilter}
        UNION ALL
        SELECT b.bot_name, c.status FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2 ${browserFilter}
      ) combined
      GROUP BY bot_name
      ORDER BY requests DESC
      LIMIT 10
    `, [site_id, daysAgo]);

    res.json(popularBots);
  } catch (error) {
    console.error('Error fetching popular bots:', error);
    res.status(500).json({ error: 'Failed to fetch popular bots' });
  }
});

// GET /analytics/popular-paths - Top paths by activity
router.get('/analytics/popular-paths', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7 } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const popularPaths = await query(`
      SELECT 
        path,
        COUNT(*) as visits,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_visits,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_visits
      FROM (
        SELECT path, status FROM bot_crawl_logs WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT path, status FROM crawls WHERE site_id = $1 AND timestamp >= $2
      ) combined
      GROUP BY path
      ORDER BY visits DESC
      LIMIT 10
    `, [site_id, daysAgo]);

    res.json(popularPaths);
  } catch (error) {
    console.error('Error fetching popular paths:', error);
    res.status(500).json({ error: 'Failed to fetch popular paths' });
  }
});

// GET /analytics/timeline - Activity over time
router.get('/analytics/timeline', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7 } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const timeline = await query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_crawls,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_crawls,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_crawls
      FROM (
        SELECT timestamp, status FROM bot_crawl_logs WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT timestamp, status FROM crawls WHERE site_id = $1 AND timestamp >= $2
      ) combined
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `, [site_id, daysAgo]);

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// GET /analytics/path-details - Detailed path analytics with success rates and trends
router.get('/analytics/path-details', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7, path } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let pathFilter = '';
    let params = [site_id, daysAgo];
    
    if (path) {
      pathFilter = 'AND path = $3';
      params.push(path as string);
    }

    const pathDetails = await query(`
      SELECT 
        path,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_requests,
        ROUND(
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::float / COUNT(*)::float) * 100, 2
        ) as success_rate,
        COUNT(DISTINCT bot_name) as unique_bots,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen
      FROM (
        SELECT path, status, bot_name, timestamp FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2 ${pathFilter}
        UNION ALL
        SELECT c.path, c.status, b.bot_name, c.timestamp FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2 ${pathFilter}
      ) combined
      GROUP BY path
      ORDER BY total_requests DESC
    `, params);

    res.json(pathDetails);
  } catch (error) {
    console.error('Error fetching path details:', error);
    res.status(500).json({ error: 'Failed to fetch path details' });
  }
});

// GET /analytics/geographic - Geographic distribution of requests
router.get('/analytics/geographic', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7 } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const geographic = await query(`
      SELECT 
        COALESCE(ip_address, 'Unknown') as country,
        COUNT(*) as requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests,
        COUNT(DISTINCT bot_name) as unique_bots
      FROM (
        SELECT ip_address, status, bot_name FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT NULL as ip_address, c.status, b.bot_name FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2
      ) combined
      GROUP BY ip_address
      ORDER BY requests DESC
    `, [site_id, daysAgo]);

    res.json(geographic);
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    res.status(500).json({ error: 'Failed to fetch geographic data' });
  }
});

// GET /analytics/performance - Performance metrics and response times
router.get('/analytics/performance', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7 } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const performance = await query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests,
        ROUND(
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::float / COUNT(*)::float) * 100, 2
        ) as success_rate,
        COUNT(DISTINCT bot_name) as unique_bots,
        COUNT(DISTINCT path) as unique_paths
      FROM (
        SELECT timestamp, status, bot_name, path FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT c.timestamp, c.status, b.bot_name, c.path FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2
      ) combined
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `, [site_id, daysAgo]);

    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// GET /analytics/realtime - Real-time bot activity (last 24 hours)
router.get('/analytics/realtime', async (req: Request, res: Response) => {
  try {
    const { site_id } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const realtime = await query(`
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests,
        COUNT(DISTINCT bot_name) as unique_bots,
        COUNT(DISTINCT path) as unique_paths
      FROM (
        SELECT timestamp, status, bot_name, path FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT c.timestamp, c.status, b.bot_name, c.path FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2
      ) combined
      GROUP BY DATE_TRUNC('hour', timestamp)
      ORDER BY hour ASC
    `, [site_id, last24Hours]);

    res.json(realtime);
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

// GET /analytics/bot-details - Detailed bot analytics
router.get('/analytics/bot-details', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 7, bot_name } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let botFilter = '';
    let params = [site_id, daysAgo];
    
    if (bot_name) {
      botFilter = 'AND bot_name = $3';
      params.push(bot_name as string);
    }

    const botDetails = await query(`
      SELECT 
        bot_name,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_requests,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_requests,
        ROUND(
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::float / COUNT(*)::float) * 100, 2
        ) as success_rate,
        COUNT(DISTINCT path) as unique_paths,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen,
        AVG(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))) as avg_session_duration
      FROM (
        SELECT bot_name, status, path, timestamp FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2 ${botFilter}
        UNION ALL
        SELECT b.bot_name, c.status, c.path, c.timestamp FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2 ${botFilter}
      ) combined
      GROUP BY bot_name
      ORDER BY total_requests DESC
    `, params);

    res.json(botDetails);
  } catch (error) {
    console.error('Error fetching bot details:', error);
    res.status(500).json({ error: 'Failed to fetch bot details' });
  }
});

// GET /analytics/trends - Trend analysis over time
router.get('/analytics/trends', async (req: Request, res: Response) => {
  try {
    const { site_id, days = 30, metric = 'requests' } = req.query;
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let metricColumn = 'COUNT(*)';
    if (metric === 'success_rate') {
      metricColumn = 'ROUND((COUNT(CASE WHEN status = \'success\' THEN 1 END)::float / COUNT(*)::float) * 100, 2)';
    } else if (metric === 'unique_bots') {
      metricColumn = 'COUNT(DISTINCT bot_name)';
    } else if (metric === 'unique_paths') {
      metricColumn = 'COUNT(DISTINCT path)';
    }

    const trends = await query(`
      SELECT 
        DATE(timestamp) as date,
        ${metricColumn} as value
      FROM (
        SELECT timestamp, status, bot_name, path FROM bot_crawl_logs 
        WHERE site_id = $1 AND timestamp >= $2
        UNION ALL
        SELECT c.timestamp, c.status, b.bot_name, c.path FROM crawls c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.site_id = $1 AND c.timestamp >= $2
      ) combined
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `, [site_id, daysAgo]);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/unknown-bots
router.get('/unknown-bots', async (req: Request, res: Response) => {
  try {
    const bots = await query('SELECT * FROM unknown_bots ORDER BY last_seen DESC');
    res.json(bots);
  } catch (error) {
    console.error('Error fetching unknown bots:', error);
    res.status(500).json({ error: 'Failed to fetch unknown bots' });
  }
});

// GET /sites/:id/unknown-bot-prefs
router.get('/sites/:id/unknown-bot-prefs', async (req: Request, res: Response) => {
  try {
    const { id: site_id } = req.params;
    const prefs = await query(
      `SELECT p.*, ub.user_agent, ub.bot_name, ub.total_requests, ub.blocked_requests
       FROM site_unknown_bot_preferences p
       JOIN unknown_bots ub ON p.unknown_bot_id = ub.id
       WHERE p.site_id = $1
       ORDER BY ub.last_seen DESC`,
      [site_id]
    );
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching site unknown bot preferences:', error);
    res.status(500).json({ error: 'Failed to fetch site unknown bot preferences' });
  }
});

// POST /sites/:id/unknown-bot-prefs
router.post('/sites/:id/unknown-bot-prefs', async (req: Request, res: Response) => {
  try {
    const { id: site_id } = req.params;
    const { unknown_bot_id, blocked } = req.body;
    if (!unknown_bot_id || typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'unknown_bot_id and blocked(boolean) are required' });
    }
    
    // Upsert preference
    const existing = await queryOne(
      'SELECT id FROM site_unknown_bot_preferences WHERE site_id = $1 AND unknown_bot_id = $2',
      [site_id, unknown_bot_id]
    );
    
    if (existing) {
      await query(
        'UPDATE site_unknown_bot_preferences SET blocked = $1, updated_at = now() WHERE id = $2',
        [blocked, existing.id]
      );
    } else {
      await query(
        'INSERT INTO site_unknown_bot_preferences (site_id, unknown_bot_id, blocked, created_at, updated_at) VALUES ($1, $2, $3, now(), now())',
        [site_id, unknown_bot_id, blocked]
      );
    }
    res.json({ message: 'Unknown bot preference updated' });
  } catch (error) {
    console.error('Error updating site unknown bot preference:', error);
    res.status(500).json({ error: 'Failed to update site unknown bot preference' });
  }
});

// POST /api/unknown-bot-discovery - For middleware to register new unknown bots
router.post('/unknown-bot-discovery', async (req: Request, res: Response) => {
  try {
    const { user_agent, bot_name } = req.body;
    if (!user_agent || !bot_name) {
      return res.status(400).json({ error: 'user_agent and bot_name are required' });
    }

    // Check if unknown bot already exists
    let unknownBot = await queryOne(
      'SELECT * FROM unknown_bots WHERE user_agent = $1',
      [user_agent]
    );

    if (unknownBot) {
      // Update existing unknown bot
      await query(
        `UPDATE unknown_bots 
         SET last_seen = now(), 
             total_requests = total_requests + 1,
             updated_at = now()
         WHERE id = $1`,
        [unknownBot.id]
      );
    } else {
      // Create new unknown bot
      const id = uuidv4();
      await query(
        `INSERT INTO unknown_bots (id, user_agent, bot_name, first_seen, last_seen, total_requests, created_at, updated_at) 
         VALUES ($1, $2, $3, now(), now(), 1, now(), now())`,
        [id, user_agent, bot_name]
      );
      unknownBot = { id, user_agent, bot_name };
    }

    res.json({ message: 'Unknown bot recorded', bot: unknownBot });
  } catch (error) {
    console.error('Error recording unknown bot discovery:', error);
    res.status(500).json({ error: 'Failed to record unknown bot discovery' });
  }
});

export default router; 