import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Types
interface AuthRequest extends Request {
  userId?: string;
  orgId?: string;
}

const router = Router();

const supabase = createClient(
  config.supabase.url!,
  config.supabase.serviceKey!
);

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email, password, and name are required',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password too short',
        details: 'Password must be at least 8 characters',
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        details: 'An account with this email already exists',
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({
        error: authError?.message || 'Failed to create user',
      });
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Failed to create user profile',
      });
    }

    console.log('👤 User registered:', { id: authData.user.id, email, name });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return session token
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        details: 'email and password are required',
      });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.error('Login error:', authError);
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect',
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    console.log('🔓 User logged in:', { id: authData.user.id, email });

    res.json({
      success: true,
      message: 'Login successful',
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: profile?.name,
          avatar_url: profile?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token',
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      return res.status(401).json({
        error: 'Failed to refresh token',
        details: error?.message || 'Invalid refresh token',
      });
    }

    console.log('🔄 Token refreshed for user:', data.user?.id);

    res.json({
      success: true,
      message: 'Token refreshed',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout a user and invalidate session
 */
router.post('/logout', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'User ID not found in request',
      });
    }

    // Sign out from all devices
    const { error } = await supabase.auth.admin.signOut(userId);

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        error: 'Failed to logout',
      });
    }

    console.log('🔓 User logged out:', userId);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'User ID not found in request',
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
});

export default router;
