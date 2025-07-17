import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../models/db';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'site_owner' | 'bot_developer';
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Get user from database
    const user = await queryOne(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
}

export function requireRole(allowedRoles: ('site_owner' | 'bot_developer')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

export function requireSiteOwner(req: Request, res: Response, next: NextFunction) {
  return requireRole(['site_owner'])(req, res, next);
}

export function requireBotDeveloper(req: Request, res: Response, next: NextFunction) {
  return requireRole(['bot_developer'])(req, res, next);
} 