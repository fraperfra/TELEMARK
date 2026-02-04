import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Types
interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Supabase client for JWT verification
const supabase = createClient(
  config.supabase.url!,
  config.supabase.serviceKey!
);

/**
 * Verify JWT token from Authorization header
 * Attaches user information to request object
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('Token verification failed:', error?.message);
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid or expired token',
      });
    }

    // Attach user info to request
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
}

/**
 * Optional auth middleware
 * Does not fail if token is missing, just sets user info if present
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        req.userId = user.id;
        req.userEmail = user.email;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't block request on error for optional auth
    next();
  }
}

/**
 * Admin-only middleware
 * Checks if user has admin role
 */
export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // First verify token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid or expired token',
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'Admin privileges required',
      });
    }

    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: config.nodeEnv === 'development' ? (error as any).message : undefined,
    });
  }
}

export default authMiddleware;
