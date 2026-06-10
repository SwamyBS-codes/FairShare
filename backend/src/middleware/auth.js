import { verifyToken } from '../utils/jwt.js';

export default (req, res, next) => {
  // Extract JWT from Authorization header: Bearer <token>
  const authHeader = req.header('Authorization');
  console.log(`[Auth] ${req.method} ${req.path} - Authorization header:`, authHeader ? `${authHeader.substring(0, 30)}...` : 'MISSING');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth header, continue without user
    console.log('[Auth] No valid Bearer token found');
    return next();
  }

  const token = authHeader.slice(7);
  console.log('[Auth] Token found in header, length:', token.length);
  
  const decoded = verifyToken(token);
  if (decoded) {
    console.log('[Auth] Token verified for user:', decoded.id);
    req.user = decoded;
  } else {
    console.log('[Auth] Token verification failed');
  }
  next();
};
