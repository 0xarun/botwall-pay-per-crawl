import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { authenticateToken, requireSiteOwner } from '../middleware/auth';

const router = Router();

// Get all sites for the authenticated user
router.get('/', authenticateToken, requireSiteOwner, async (req: Request, res: Response) => {
  try {
    const sites = await query(
      'SELECT * FROM sites WHERE owner_id = $1 ORDER BY created_at DESC',
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
    const { name, domain, price_per_crawl } = req.body;
    if (!name || !domain) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and domain are required.'
      });
    }
    // Check for domain conflict
    const domainConflict = await queryOne(
      'SELECT id FROM sites WHERE domain = $1',
      [domain]
    );
    if (domainConflict) {
      return res.status(409).json({
        error: 'Domain conflict',
        message: 'A site with this domain already exists.'
      });
    }
    const id = crypto.randomUUID();
    await query(
      'INSERT INTO sites (id, owner_id, name, domain, price_per_crawl, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now())',
      [id, req.user!.id, name, domain, price_per_crawl || 0.01]
    );
    const site = await queryOne('SELECT * FROM sites WHERE id = $1', [id]);
    res.status(201).json({
      message: 'Site created successfully',
      site
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
      'SELECT * FROM sites WHERE id = $1 AND owner_id = $2',
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