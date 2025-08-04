import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { generateBotId, generateApiKey } from '../utils/generators';
import { authenticateToken, requireBotDeveloper } from '../middleware/auth';
import nacl from 'tweetnacl';
import { config } from 'dotenv';
config();

const router = Router();

// Get all bots for the authenticated user
router.get('/', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    const bots = await query(
      'SELECT * FROM bots WHERE developer_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(bots);
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch bots'
    });
  }
});

// Get bot info (for SDK verification) - MUST be before /:id routes
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { botId, botApiKey } = req.body;
    if (!botId || !botApiKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Bot ID and API key are required'
      });
    }
    const bot = await queryOne(
      'SELECT bot_id, bot_name, credits FROM bots WHERE bot_id = $1 AND api_key = $2',
      [botId, botApiKey]
    );
    if (!bot) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid bot ID or API key'
      });
    }
    res.json({
      botId: bot.bot_id,
      botName: bot.bot_name,
      credits: bot.credits
    });
  } catch (error) {
    console.error('Get bot info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get bot info'
    });
  }
});

// Create a new bot
router.post('/', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    const { bot_name, usage_reason } = req.body;
    // Validate input
    if (!bot_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Bot name is required'
      });
    }
    // Generate unique bot_id and api_key
    const botId = generateBotId();
    const apiKey = generateApiKey();
    // Create bot
    const id = generateBotId();
    await query(
      'INSERT INTO bots (id, developer_id, bot_name, bot_id, api_key, usage_reason, credits, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())',
      [id, req.user!.id, bot_name, botId, apiKey, usage_reason, 0]
    );
    const bot = await queryOne('SELECT * FROM bots WHERE id = $1', [id]);
    res.status(201).json({
      message: 'Bot created successfully',
      bot
    });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create bot'
    });
  }
});

// Register a new bot and return an Ed25519 keypair (private_key only shown once)
router.post('/register-bot', async (req: Request, res: Response) => {
  try {
    const { bot_name, usage_reason, developer_id } = req.body;
    // Input validation
    if (!bot_name || typeof bot_name !== 'string' || bot_name.length < 2 || bot_name.length > 64) {
      return res.status(400).json({
        error: 'Invalid bot_name',
        message: 'Bot name is required and must be 2-64 characters.'
      });
    }
    if (!developer_id || typeof developer_id !== 'string' || developer_id.length < 2) {
      return res.status(400).json({
        error: 'Invalid developer_id',
        message: 'Developer ID is required and must be a valid string.'
      });
    }
    if (usage_reason && typeof usage_reason !== 'string') {
      return res.status(400).json({
        error: 'Invalid usage_reason',
        message: 'Usage reason must be a string if provided.'
      });
    }
    // Generate Ed25519 keypair
    const keypair = nacl.sign.keyPair();
    const publicKey = Buffer.from(keypair.publicKey).toString('base64');
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');
    const generatedAt = new Date().toISOString();
    // Generate unique bot_id and api_key
    const botId = generateBotId();
    const apiKey = generateApiKey();
    const id = generateBotId();
    await query(
      'INSERT INTO bots (id, developer_id, bot_name, bot_id, api_key, usage_reason, public_key, generated_at, credits, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())',
      [id, developer_id, bot_name, botId, apiKey, usage_reason, publicKey, generatedAt, 0]
    );
    const bot = await queryOne('SELECT * FROM bots WHERE id = $1', [id]);
    res.status(201).json({
      message: 'Bot registered successfully.',
      bot: {
        id: bot.id,
        developer_id: bot.developer_id,
        bot_name: bot.bot_name,
        bot_id: bot.bot_id,
        api_key: bot.api_key,
        usage_reason: bot.usage_reason,
        public_key: bot.public_key,
        generated_at: bot.generated_at,
        private_key: {
          value: privateKey,
          description: 'Store this private key securely. It will NOT be shown again or stored by the server.'
        }
      },
      docs: {
        info: 'Use the public_key for signature verification. The private_key is for your bot to sign requests.'
      }
    });
  } catch (error) {
    console.error('Register bot error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register bot.'
    });
  }
});

// Get a specific bot
router.get('/:id', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bot = await queryOne(
      'SELECT * FROM bots WHERE id = $1 AND developer_id = $2',
      [id, req.user!.id]
    );
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Bot does not exist or you do not have access to it'
      });
    }
    res.json(bot);
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch bot'
    });
  }
});

// DEV ONLY: Mock add credits to a bot (now uses bot_id for public API consistency)
router.post('/:botId/mock-add-credits', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Mock credit addition is only allowed in development mode.' });
  }
  const { botId } = req.params;
  const { credits } = req.body;
  if (!credits || typeof credits !== 'number' || credits < 1) {
    return res.status(400).json({ error: 'Invalid credits amount.' });
  }
  // Find bot by bot_id
  const bot = await queryOne('SELECT * FROM bots WHERE bot_id = $1', [botId]);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found.' });
  }
  // Add credits
  await query('UPDATE bots SET credits = credits + $1, updated_at = now() WHERE bot_id = $2', [credits, botId]);
  const updatedBot = await queryOne('SELECT * FROM bots WHERE bot_id = $1', [botId]);
  res.json({ message: `Added ${credits} credits to bot.`, bot: updatedBot });
});

// Get middleware snippet for a bot
router.get('/bot/:id/middleware-snippet', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bot = await queryOne('SELECT * FROM bots WHERE id = $1', [id]);
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'No bot exists with the provided id.'
      });
    }
    const snippet = `import { validateCrawlRequest } from '@botwall/middleware';\n\napp.use('/docs', validateCrawlRequest);`;
    res.status(200).json({
      bot_id: bot.bot_id,
      snippet,
      language: 'typescript',
      description: 'Add this middleware to your Express app to secure your /docs route.'
    });
  } catch (error) {
    console.error('Get middleware snippet error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate middleware snippet.'
    });
  }
});

// --- PUBLIC: Check if a bot is registered (for middleware classification) ---
router.post('/check-registered', async (req: Request, res: Response) => {
  try {
    const { user_agent } = req.body;
    if (!user_agent) {
      return res.status(400).json({ 
        error: 'Missing user_agent', 
        message: 'User agent is required' 
      });
    }
    
    // Check if this user agent matches any registered bot
    const bot = await queryOne(
      'SELECT bot_id, bot_name, public_key FROM bots WHERE bot_name ILIKE $1 OR $1 ILIKE CONCAT(\'%\', bot_name, \'%\')',
      [user_agent]
    );
    
    if (bot) {
      res.json({ 
        is_registered: true, 
        bot_id: bot.bot_id, 
        bot_name: bot.bot_name,
        public_key: bot.public_key 
      });
    } else {
      res.json({ is_registered: false });
    }
  } catch (error) {
    console.error('Check registered bot error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to check bot registration status.' 
    });
  }
});

// --- PUBLIC: Get public key for a bot/crawler (for middleware verification) ---
router.get('/:crawlerId/public-key', async (req: Request, res: Response) => {
  try {
    const { crawlerId } = req.params;
    const bot = await queryOne('SELECT public_key FROM bots WHERE bot_id = $1', [crawlerId]);
    if (!bot || !bot.public_key) {
      return res.status(404).json({ error: 'Bot not found', message: 'No bot with this crawlerId.' });
    }
    res.json({ publicKey: bot.public_key });
  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch public key.' });
  }
});

// Update a bot
router.put('/:id', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bot_name, usage_reason } = req.body;
    // Check if bot exists and belongs to user
    const existingBot = await queryOne(
      'SELECT id FROM bots WHERE id = $1 AND developer_id = $2',
      [id, req.user!.id]
    );
    if (!existingBot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Bot does not exist or you do not have access to it'
      });
    }
    // Update bot
    await query(
      'UPDATE bots SET bot_name = $1, usage_reason = $2, updated_at = now() WHERE id = $3',
      [bot_name, usage_reason, id]
    );
    const updatedBot = await queryOne('SELECT * FROM bots WHERE id = $1', [id]);
    res.json({
      message: 'Bot updated successfully',
      bot: updatedBot
    });
  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update bot'
    });
  }
});

// Delete a bot
router.delete('/:id', authenticateToken, requireBotDeveloper, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if bot exists and belongs to user
    const existingBot = await queryOne(
      'SELECT id FROM bots WHERE id = $1 AND developer_id = $2',
      [id, req.user!.id]
    );
    if (!existingBot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Bot does not exist or you do not have access to it'
      });
    }
    // Delete bot (cascading will handle related records)
    await query('DELETE FROM bots WHERE id = $1', [id]);
    res.json({
      message: 'Bot deleted successfully'
    });
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete bot'
    });
  }
});

export default router; 