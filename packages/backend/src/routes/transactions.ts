import { Router, Request, Response } from 'express';
import { query, queryOne } from '../models/db';
import { authenticateToken } from '../middleware/auth';
import { creditPacks } from '../config/creditPacks';
import crypto from 'crypto';

const router = Router();

// Get all transactions for the authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const transactions = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch transactions.'
    });
  }
});

// Create a new transaction (for checkout)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { botId, amount, credits } = req.body;
    if (!botId || typeof botId !== 'string' || !amount || typeof amount !== 'number' || !credits || typeof credits !== 'number') {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'botId, amount, and credits are required.'
      });
    }
    // Verify bot belongs to user
    const bot = await queryOne(
      'SELECT id FROM bots WHERE id = $1 AND developer_id = $2',
      [botId, req.user!.id]
    );
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Bot does not exist or you do not have access to it.'
      });
    }
    // Create transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(
      'INSERT INTO transactions (id, user_id, bot_id, amount, credits, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, now())',
      [transactionId, req.user!.id, botId, amount, credits, 'pending']
    );
    const transaction = await queryOne('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    res.status(201).json({
      message: 'Transaction created successfully.',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create transaction.'
    });
  }
});

/**
 * @route POST /api/transactions/create-checkout
 * @desc Create a LemonSqueezy checkout session for purchasing credits
 * @access private (authenticated users)
 * @body {string} botId - The bot to credit
 * @body {string} packName - The name of the credit pack
 * @returns {Object} JSON with checkoutUrl
 */
router.post('/create-checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { botId, packName } = req.body;
    if (!botId || !packName) {
      return res.status(400).json({ error: 'Missing botId or packName' });
    }
    // Validate bot ownership
    const bot = await queryOne('SELECT * FROM bots WHERE bot_id = $1 AND developer_id = $2', [botId, req.user!.id]);
    if (!bot) {
      return res.status(403).json({ error: 'Bot not found or not owned by user' });
    }
    // Validate pack
    const pack = creditPacks.find(p => p.name === packName);
    if (!pack) {
      return res.status(400).json({ error: 'Invalid packName' });
    }
    // Create pending transaction
    const transactionId = crypto.randomUUID();
    await query(
      'INSERT INTO transactions (id, user_id, bot_id, amount, credits, status, pack_name, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())',
      [transactionId, req.user!.id, bot.id, pack.price, pack.credits, 'pending', pack.name]
    );
    // Debug: log store and variant IDs and request body
    const storeId = String(process.env.LEMONSQUEEZY_STORE_ID);
    const variantId = String(pack.variantId);
    const requestBody = JSON.stringify({
      data: {
        type: 'checkouts',
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    });
    console.log('LemonSqueezy storeId:', storeId);
    console.log('LemonSqueezy variantId:', variantId);
    console.log('LemonSqueezy requestBody:', requestBody);
    // Call LemonSqueezy API to create checkout session
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestBody
    });
    if (!response.ok) {
      console.error('LemonSqueezy API error:', await response.text());
      return res.status(500).json({ error: 'Failed to create LemonSqueezy checkout session' });
    }
    const data: any = await response.json();
    const checkoutUrl = data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return res.status(500).json({ error: 'No checkout URL returned from LemonSqueezy' });
    }
    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create checkout session (simulates payment gateway)
router.post('/checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { botId, amount, credits } = req.body;
    if (!botId || !amount || !credits) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'botId, amount, and credits are required'
      });
    }
    // Verify bot belongs to user
    const bot = await queryOne(
      'SELECT id FROM bots WHERE id = $1 AND developer_id = $2',
      [botId, req.user!.id]
    );
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Bot does not exist or you do not have access to it'
      });
    }
    // Create pending transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(
      'INSERT INTO transactions (id, user_id, bot_id, amount, credits, status, lemon_order_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())',
      [transactionId, req.user!.id, botId, amount, credits, 'pending', `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`]
    );
    // Simulate checkout URL (in production, this would be a real payment gateway URL)
    const checkoutUrl = `https://checkout.lemonsqueezy.com/checkout/buy?product_id=123&custom[bot_id]=${botId}&custom[transaction_id]=${transactionId}&custom[credits]=${credits}&custom[amount]=${amount}`;
    res.json({
      message: 'Checkout session created',
      checkoutUrl,
      transactionId
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create checkout session'
    });
  }
});

// Process payment (simulate)
router.post('/process/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Get transaction
    const transaction = await queryOne('SELECT * FROM transactions WHERE id = $1', [id]);
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction does not exist.'
      });
    }
    // Mark as completed
    await query(
      'UPDATE transactions SET status = $1 WHERE id = $2',
      ['completed', id]
    );
    res.json({
      message: 'Payment processed successfully.'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process payment.'
    });
  }
});

/**
 * @route POST /api/transactions/webhook
 * @desc Handle LemonSqueezy payment webhooks
 * @access public (called by LemonSqueezy)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not set');
      return res.status(500).json({ error: 'Webhook secret not set' });
    }
    // Get raw body for signature verification
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    await new Promise(resolve => req.on('end', resolve));
    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    // Parse event
    const event = JSON.parse(rawBody);
    if (event?.meta?.event_name !== 'order_created') {
      return res.status(200).json({ message: 'Event ignored' });
    }
    const custom = event?.data?.attributes?.custom;
    const lemonOrderId = event?.data?.id;
    if (!custom || !custom.transactionId) {
      console.error('Missing custom metadata in webhook');
      return res.status(400).json({ error: 'Missing custom metadata' });
    }
    // Find transaction
    const transaction = await queryOne('SELECT * FROM transactions WHERE id = $1', [custom.transactionId]);
    if (!transaction) {
      console.error('Transaction not found for webhook');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (transaction.status === 'completed') {
      console.log('Transaction already completed, skipping');
      return res.status(200).json({ message: 'Already processed' });
    }
    // Mark transaction as completed and store LemonSqueezy order ID
    await query('UPDATE transactions SET status = $1, lemon_order_id = $2 WHERE id = $3', ['completed', lemonOrderId, custom.transactionId]);
    // Add credits to bot
    await query('UPDATE bots SET credits = credits + $1 WHERE id = $2', [transaction.credits, transaction.bot_id]);
    console.log(`Credited ${transaction.credits} to bot ${transaction.bot_id} for transaction ${transaction.id}`);
    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 