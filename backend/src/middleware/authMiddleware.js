const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');
const prisma = require('../config/db');

/**
 * JWT Authentication Middleware
 * 
 * Verifies the Bearer token in the Authorization header.
 * Extracts authenticated tenant identity and attaches it to req.user.
 * Rejects missing, invalid, or expired tokens with 401 Unauthorized.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication token missing or invalid format. Expected format: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 401, 'Authentication token missing.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token has expired. Please log in again.');
      }
      return errorResponse(res, 401, 'Invalid authentication token.');
    }

    // Ensure token contains required tenant identity
    if (!decoded.userId || !decoded.organizationId || !decoded.role) {
      return errorResponse(res, 401, 'Invalid token payload.');
    }

    // Attach verified user information to request
    req.user = {
      id: Number(decoded.userId),
      organizationId: Number(decoded.organizationId),
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware unexpected error:', error);
    return errorResponse(res, 500, 'Authentication error.');
  }
};

module.exports = authenticateToken;
