// Test script for BotWall SDK against test-site-server.js
// Run with: node test/test-sdk-bot.js

import { signRequest, sendCrawlRequest } from '../packages/sdk/dist/index.js';

// === Step 1: Paste your real bot_id and privateKey below ===
// Get these from your bot registration (bot_id from DB, privateKey shown ONCE at registration)
const BOT_ID = 'a264baf5-e642-4130-912c-f219f579d93e'; // e.g., 'bot_abc123...'
const PRIVATE_KEY = 'eqP6FkBOXRUfO6u/Eh/MrGwp6Ho35ZQWNCEq/NctOcDMTgFNPOwdHIjv4ErrSAxLDC4LGWap5ZxUoXogAzv2DQ=='; // base64 string, keep this safe!

// === Step 2: Prepare headers ===
const headers = {
  'crawler-id': BOT_ID, // This must match your registered bot_id
  'crawler-max-price': '0.05',
  'signature-input': 'crawler-id crawler-max-price',
};

// === Step 3: Sign the request ===
headers['signature'] = signRequest(headers, PRIVATE_KEY);

// === Step 4: Send the request ===
(async () => {
  try {
    const response = await sendCrawlRequest('http://localhost:3002/api/protected', headers, PRIVATE_KEY);
    const data = await response.json();
    console.log('Response from protected endpoint:', data);
  } catch (err) {
    console.error('Error during crawl request:', err);
  }
})(); 