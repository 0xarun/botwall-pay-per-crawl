import express from 'express';
import { validateCrawlRequest } from '../packages/middleware/dist/validateCrawlRequest.js';

const app = express();

// Use the validateCrawlRequest middleware directly for the protected route
app.get('/api/protected', validateCrawlRequest, (req, res) => {
  res.json({ message: 'Protected data for bots only!' });
});

app.listen(3002, () => {
  console.log('Test Site Owner API running on http://localhost:3002');
});
