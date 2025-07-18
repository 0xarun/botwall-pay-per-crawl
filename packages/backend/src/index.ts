// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import './models/db';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import siteRoutes from './routes/sites';
import transactionRoutes from './routes/transactions';
import crawlRoutes from './routes/crawls';
import verifyRoutes from './routes/verify';
import { Router } from 'express';

// Load environment variables
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
// CORS: Use FRONTEND_URL from environment, fallback to localhost for dev
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/crawls', crawlRoutes);
app.use('/api/verify', verifyRoutes);

// Expose /api/register-bot as a top-level route for bot onboarding
let registerBotHandler = null;
if (botRoutes && botRoutes.stack) {
  const regRoute = botRoutes.stack.find(r => r.route && r.route.path === '/register-bot');
  if (regRoute && regRoute.route && regRoute.route.stack && regRoute.route.stack[0]) {
    registerBotHandler = regRoute.route.stack[0].handle;
  }
}
if (registerBotHandler) {
  app.post('/api/register-bot', registerBotHandler);
} else {
  console.error('Could not find /register-bot handler in botsRouter.');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // No explicit database initialization needed
    console.log('✅ Database pool created successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 