# BotWall Production Deployment Guide

This guide covers deploying BotWall to production environments with proper environment configuration.

## 🚀 Quick Start

### 1. Environment Setup

#### Frontend (Dashboard)
1. Copy `dashboard/env.example` to `dashboard/.env.local`
2. Set `VITE_BACKEND_URL` to your production API URL
3. Configure feature flags as needed

#### Backend
1. Copy `packages/backend/env.example` to `packages/backend/.env`
2. Set all required environment variables
3. Ensure database is properly configured

### 2. Build Commands

```bash
# Build frontend
cd dashboard
npm run build

# Build backend
cd packages/backend
npm run build
```

## 🌍 Environment Variables

### Frontend (Vite) Variables
All frontend environment variables must be prefixed with `VITE_`:

```bash
# Required
VITE_BACKEND_URL=https://your-api-domain.com/api

# Optional
VITE_APP_NAME=BotWall Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK_CREDITS=false
VITE_ENABLE_ANALYTICS=true
```

### Backend Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database
# OR for Supabase
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Payments (Optional)
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Features
ENABLE_MOCK_CREDITS=false
LOG_LEVEL=info
```

## 🏗️ Deployment Platforms

### Vercel (Frontend)
1. Connect your repository
2. Set build command: `cd dashboard && npm run build`
3. Set output directory: `dashboard/dist`
4. Add environment variables in Vercel dashboard

### Railway (Backend)
1. Connect your repository
2. Set root directory: `packages/backend`
3. Add environment variables in Railway dashboard
4. Deploy

### Render (Full Stack)
1. Create a new Web Service
2. Set build command: `cd packages/backend && npm install && npm run build`
3. Set start command: `cd packages/backend && npm start`
4. Add environment variables

### Docker (Custom)
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY packages/backend/package*.json ./
RUN npm ci --only=production
COPY packages/backend/dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔒 Security Checklist

- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Disable mock credits in production
- [ ] Use environment-specific database URLs
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts

## 📊 Monitoring

### Health Check Endpoint
Monitor your backend health at: `https://your-api-domain.com/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Environment Validation
The backend will validate required environment variables on startup and fail fast if any are missing.

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly
2. **Database Connection**: Check `DATABASE_URL` format and SSL settings
3. **Build Failures**: Ensure all environment variables are set
4. **API 404s**: Verify `VITE_BACKEND_URL` points to correct endpoint

### Debug Mode
For debugging, set `NODE_ENV=development` and `LOG_LEVEL=debug` in backend environment.

## 📝 Environment File Templates

### Production Frontend (.env.production)
```bash
VITE_BACKEND_URL=https://your-api-domain.com/api
VITE_APP_NAME=BotWall Dashboard
VITE_ENABLE_MOCK_CREDITS=false
VITE_ENABLE_ANALYTICS=true
```

### Production Backend (.env.production)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
ENABLE_MOCK_CREDITS=false
LOG_LEVEL=info
``` 