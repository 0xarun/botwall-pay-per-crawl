import express from 'express';
import { validateCrawlRequest } from '../packages/middleware/dist/validateCrawlRequest.js';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Use the validateCrawlRequest middleware with backend URL configuration
app.get('/api/protected', validateCrawlRequest({
  backendUrl: 'https://botwall-backend.onrender.com' // Point to your backend
}), (req, res) => {
  res.json({ message: 'Protected data for bots only!' });
});

app.listen(3002, () => {
  console.log('Test Site Owner API running on http://localhost:3002');
  console.log('Backend URL: http://localhost:3001');
  console.log('✅ Ready to test signed bots and known bots!');
});