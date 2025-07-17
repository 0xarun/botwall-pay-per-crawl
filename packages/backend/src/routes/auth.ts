import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../models/db';
import { generateUserId } from '../utils/generators';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @route POST /api/signup
 * @desc Register a new user (site owner or bot developer)
 * @access public
 * @body {string} email - User email (required)
 * @body {string} password - User password (required)
 * @body {string} full_name - Full name (optional)
 * @body {string} role - 'site_owner' or 'bot_developer' (required)
 * @returns {Object} JSON with user info
 * @error 400 - Missing or invalid fields
 * @error 409 - User already exists
 * @error 500 - Internal server error
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;
    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'A valid email is required.'
      });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password is required and must be at least 6 characters.'
      });
    }
    if (!role || !['site_owner', 'bot_developer'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be either "site_owner" or "bot_developer".'
      });
    }
    // Check if user already exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists.'
      });
    }
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // Create user
    const userId = generateUserId();
    await query(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, passwordHash, full_name, role]
    );
    // Create profile (for backward compatibility)
    await query(
      'INSERT INTO profiles (id, user_id, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
      [generateUserId(), userId, email, full_name, role]
    );
    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: userId,
        email,
        full_name,
        role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign up.'
    });
  }
});

/**
 * @route POST /api/signin
 * @desc Sign in a user and return a JWT token
 * @access public
 * @body {string} email - User email (required)
 * @body {string} password - User password (required)
 * @returns {Object} JSON with JWT token, user info, and profile
 * @error 400 - Missing required fields
 * @error 401 - Invalid credentials
 * @error 500 - Internal server error
 */
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'A valid email is required.'
      });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password is required.'
      });
    }
    // Get user
    const user = await queryOne(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email]
    );
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect.'
      });
    }
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect.'
      });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    // Get profile
    const profile = await queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );
    res.json({
      message: 'Sign in successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign in.'
    });
  }
});

/**
 * @route GET /api/profile
 * @desc Get the authenticated user's profile
 * @access private
 * @returns {Object} JSON with profile info
 * @error 404 - Profile not found
 * @error 500 - Internal server error
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const profile = await queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user!.id]
    );

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist.'
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get profile.'
    });
  }
});

/**
 * @route PUT /api/profile
 * @desc Update the authenticated user's profile
 * @access private
 * @body {string} full_name - New full name (required)
 * @returns {Object} JSON with updated profile info
 * @error 400 - Missing or invalid fields
 * @error 500 - Internal server error
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { full_name } = req.body;
    if (!full_name || typeof full_name !== 'string' || full_name.length < 2) {
      return res.status(400).json({
        error: 'Invalid full_name',
        message: 'Full name is required and must be at least 2 characters.'
      });
    }
    await query(
      'UPDATE profiles SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [full_name, req.user!.id]
    );
    await query(
      'UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [full_name, req.user!.id]
    );
    const updatedProfile = await queryOne(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user!.id]
    );
    res.json({
      message: 'Profile updated successfully.',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile.'
    });
  }
});

export default router; 