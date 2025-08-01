import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { authenticateToken, requireSiteOwner } from '../middleware/auth';
import crypto from 'crypto';
import { generateSiteId } from '../utils/siteIdGenerator';
import { generateMiddlewareCode, generateInstallationInstructions } from '../utils/codeGenerator';

const router = Router();

// Get all sites for the authenticated user
router.get('/', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const sites = await query(
      'SELECT s.*, mv.status as middleware_status, mv.last_check as middleware_last_check FROM sites s LEFT JOIN middleware_verification mv ON s.id = mv.site_id WHERE s.owner_id = $1 ORDER BY s.created_at DESC',
      [req.user!.id]
    );
    res.json(sites);
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch sites'
    });
  }
});

// Create a new site
router.post('/', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      frontend_domain, 
      backend_domain, 
      monetized_routes = ['/*'], 
      price_per_crawl = 0.01 
    } = req.body;
    
    if (!name || !frontend_domain || !backend_domain) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, frontend domain, and backend domain are required.'
      });
    }
    
    // Check for domain conflicts
    const frontendConflict = await queryOne(
      'SELECT id FROM sites WHERE frontend_domain = $1 OR backend_domain = $1',
      [frontend_domain]
    );
    if (frontendConflict) {
      return res.status(409).json({
        error: 'Domain conflict',
        message: 'A site with this frontend domain already exists.'
      });
    }
    
    const backendConflict = await queryOne(
      'SELECT id FROM sites WHERE frontend_domain = $1 OR backend_domain = $1',
      [backend_domain]
    );
    if (backendConflict) {
      return res.status(409).json({
        error: 'Domain conflict',
        message: 'A site with this backend domain already exists.'
      });
    }
    
    const id = crypto.randomUUID();
    const siteId = generateSiteId();
    
    await query(
      `INSERT INTO sites (
        id, owner_id, name, domain, site_id, frontend_domain, backend_domain, 
        monetized_routes, analytics_routes, price_per_crawl, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`,
      [
        id, req.user!.id, name, frontend_domain, siteId, frontend_domain, backend_domain,
        JSON.stringify(monetized_routes), JSON.stringify(['/*']), price_per_crawl
      ]
    );
    
    // Create middleware verification record
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await query(
      'INSERT INTO middleware_verification (site_id, status, verification_token, created_at, updated_at) VALUES ($1, $2, $3, now(), now())',
      [id, 'unknown', verificationToken]
    );
    
    const site = await queryOne('SELECT * FROM sites WHERE id = $1', [id]);
    
    // Generate middleware code
    const middlewareCode = generateMiddlewareCode({
      siteId,
      monetizedRoutes: monetized_routes,
      pricePerCrawl: price_per_crawl
    });
    
    const instructions = generateInstallationInstructions(name, backend_domain);
    
    res.status(201).json({
      message: 'Site created successfully',
      site,
      siteId,
      middlewareCode,
      instructions
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create site.'
    });
  }
});

// Get a specific site
router.get('/:id', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const site = await queryOne(
      'SELECT s.*, mv.status as middleware_status, mv.last_check as middleware_last_check, mv.last_successful_check as middleware_last_successful_check, mv.verification_token, mv.middleware_version, mv.error_message FROM sites s LEFT JOIN middleware_verification mv ON s.id = mv.site_id WHERE s.id = $1 AND s.owner_id = $2',
      [id, req.user!.id]
    );
    if (!site) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    res.json(site);
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch site.'
    });
  }
});

// Update a site
router.put('/:id', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price_per_crawl } = req.body;
    // Check if site exists and belongs to user
    const existingSite = await queryOne(
      'SELECT id FROM sites WHERE id = $1 AND owner_id = $2',
      [id, req.user!.id]
    );
    if (!existingSite) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    await query(
      'UPDATE sites SET name = $1, price_per_crawl = $2, updated_at = now() WHERE id = $3',
      [name, price_per_crawl, id]
    );
    const updatedSite = await queryOne('SELECT * FROM sites WHERE id = $1', [id]);
    res.json({
      message: 'Site updated successfully',
      site: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update site.'
    });
  }
});

// Delete a site
router.delete('/:id', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if site exists and belongs to user
    const existingSite = await queryOne(
      'SELECT id FROM sites WHERE id = $1 AND owner_id = $2',
      [id, req.user!.id]
    );
    if (!existingSite) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    await query('DELETE FROM sites WHERE id = $1', [id]);
    res.json({
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete site.'
    });
  }
});

// --- MIDDLEWARE VERIFICATION ENDPOINTS ---

// Health check endpoint for middleware to call
router.get('/:id/health-check', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { token, version } = req.query;
    
    // Verify the site exists
    const site = await queryOne('SELECT id FROM sites WHERE id = $1', [id]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Verify the token
    const verification = await queryOne(
      'SELECT verification_token FROM middleware_verification WHERE site_id = $1',
      [id]
    );
    
    if (!verification || verification.verification_token !== token) {
      return res.status(401).json({ error: 'Invalid verification token' });
    }
    
    // Update verification status
    await query(
      'UPDATE middleware_verification SET status = $1, last_check = now(), last_successful_check = now(), middleware_version = $2, error_message = NULL, updated_at = now() WHERE site_id = $3',
      ['installed', version || null, id]
    );
    
    res.json({ 
      status: 'ok', 
      message: 'Middleware health check successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual verification trigger from dashboard
router.post('/:id/verify-middleware', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if site exists and belongs to user
    const site = await queryOne(
      'SELECT s.*, mv.verification_token FROM sites s LEFT JOIN middleware_verification mv ON s.id = mv.site_id WHERE s.id = $1 AND s.owner_id = $2',
      [id, req.user!.id]
    );
    
    if (!site) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    
    // Generate new verification token if needed
    let verificationToken = site.verification_token;
    if (!verificationToken) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      await query(
        'INSERT INTO middleware_verification (site_id, status, verification_token, created_at, updated_at) VALUES ($1, $2, $3, now(), now()) ON CONFLICT (site_id) DO UPDATE SET verification_token = $3, updated_at = now()',
        [id, 'unknown', verificationToken]
      );
    }
    
    // Return verification instructions
    res.json({
      message: 'Verification initiated',
      verificationUrl: `${req.protocol}://${req.get('host')}/api/sites/${id}/health-check?token=${verificationToken}`,
      instructions: [
        '1. Add this health check endpoint to your middleware',
        '2. Call this endpoint periodically (every 5-10 minutes)',
        '3. Include the verification token in the request',
        '4. The dashboard will show the verification status'
      ]
    });
  } catch (error) {
    console.error('Verify middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to initiate verification.'
    });
  }
});

// Get middleware verification status
router.get('/:id/middleware-status', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const verification = await queryOne(
      'SELECT mv.*, s.domain FROM middleware_verification mv JOIN sites s ON mv.site_id = s.id WHERE mv.site_id = $1 AND s.owner_id = $2',
      [id, req.user!.id]
    );
    
    if (!verification) {
      return res.status(404).json({
        error: 'Verification not found',
        message: 'No verification record found for this site.'
      });
    }
    
    res.json(verification);
  } catch (error) {
    console.error('Get middleware status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch middleware status.'
    });
  }
});

// --- SITE ID BASED ENDPOINTS ---

// Get site configuration by site ID (for middleware)
router.get('/config/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { hostname } = req.query;
    
    const site = await queryOne(
      'SELECT site_id, frontend_domain, backend_domain, monetized_routes, analytics_routes, price_per_crawl FROM sites WHERE site_id = $1',
      [siteId]
    );
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Verify domain authorization
    if (hostname && site.frontend_domain !== hostname && site.backend_domain !== hostname) {
      return res.status(403).json({ error: 'Domain not authorized' });
    }
    
    res.json({
      siteId: site.site_id,
      frontendDomain: site.frontend_domain,
      backendDomain: site.backend_domain,
      monetizedRoutes: site.monetized_routes,
      analyticsRoutes: site.analytics_routes,
      pricePerCrawl: Number(site.price_per_crawl)
    });
  } catch (error) {
    console.error('Get site config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get generated middleware code for a site
router.get('/:id/code', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const site = await queryOne(
      'SELECT * FROM sites WHERE id = $1 AND owner_id = $2',
      [id, req.user!.id]
    );
    
    if (!site) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    
    const middlewareCode = generateMiddlewareCode({
      siteId: site.site_id,
      monetizedRoutes: site.monetized_routes,
      pricePerCrawl: Number(site.price_per_crawl)
    });
    
    const instructions = generateInstallationInstructions(site.name, site.backend_domain);
    
    res.json({
      siteId: site.site_id,
      middlewareCode,
      instructions,
      site
    });
  } catch (error) {
    console.error('Get middleware code error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate middleware code.'
    });
  }
});

// Update site routes configuration
router.put('/:id/routes', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monetized_routes, analytics_routes } = req.body;
    
    const site = await queryOne(
      'SELECT id FROM sites WHERE id = $1 AND owner_id = $2',
      [id, req.user!.id]
    );
    
    if (!site) {
      return res.status(404).json({
        error: 'Site not found',
        message: 'Site does not exist or you do not have access to it.'
      });
    }
    
    await query(
      'UPDATE sites SET monetized_routes = $1, analytics_routes = $2, updated_at = now() WHERE id = $3',
      [JSON.stringify(monetized_routes), JSON.stringify(analytics_routes), id]
    );
    
    const updatedSite = await queryOne('SELECT * FROM sites WHERE id = $1', [id]);
    
    // Regenerate middleware code
    const middlewareCode = generateMiddlewareCode({
      siteId: updatedSite.site_id,
      monetizedRoutes: updatedSite.monetized_routes,
      pricePerCrawl: Number(updatedSite.price_per_crawl)
    });
    
    res.json({
      message: 'Routes updated successfully',
      site: updatedSite,
      middlewareCode
    });
  } catch (error) {
    console.error('Update routes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update routes.'
    });
  }
});

// --- PUBLIC: Get pricing for a domain/path (for middleware verification) ---
router.get('/:domain/pricing', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const { path } = req.query;
    const site = await queryOne('SELECT price_per_crawl FROM sites WHERE domain = $1', [domain]);
    if (!site) {
      // Default price if not found
      return res.json({ price: 0.01, blocked: false });
    }
    // TODO: Add path-based blocking logic if needed
    res.json({ price: Number(site.price_per_crawl), blocked: false });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch pricing.' });
  }
});

export default router; 