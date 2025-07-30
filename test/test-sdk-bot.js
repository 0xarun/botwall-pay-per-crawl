// Test script for BotWall SDK against test-site-server.js
// Run with: node test/test-sdk-bot.js

import { signRequest, sendCrawlRequest } from '../packages/sdk/dist/index.js';

const BOT_ID = 'ca2b162b-7376-413e-9e9d-6a83dfdb0279';

const PRIVATE_KEY = 'oRJbpuehtiNcZ7BltPHqEID6UA3VEoqZd3sFqL28O3niMM098Cg5SSOhS5Oy0oygd8LF2M3g9DglF5DFs5Ywlw=='; // base64 string, keep this safe!

const headers = {
  'crawler-id': BOT_ID, 
  'crawler-max-price': '0.05',
  'signature-input': 'crawler-id crawler-max-price',
};

headers['signature'] = signRequest(headers, PRIVATE_KEY);

(async () => {
  try {
    const response = await sendCrawlRequest('http://localhost:3002/', headers, PRIVATE_KEY);
    const data = await response.json();
    console.log('Response from protected endpoint:', data);
  } catch (err) {
    console.error('Error during crawl request:', err);
  }
})(); 