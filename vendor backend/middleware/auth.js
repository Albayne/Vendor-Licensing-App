const { verifyToken } = require('../utils/jwt');

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

/**
 * Generic authentication middleware.
 */
function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (_) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
    });
  }
}

/**
 * Restrict route to vendors only.
 */
function authenticateVendor(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'vendor') {
      return res.status(403).json({
        error: 'Vendor access only.',
      });
    }

    req.user = decoded;
    next();
  } catch (_) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
    });
  }
}

/**
 * Restrict route to admins only.
 */
function authenticateAdmin(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access only.',
      });
    }

    req.user = decoded;
    next();
  } catch (_) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
    });
  }
}

module.exports = {
  authenticate,
  authenticateVendor,
  authenticateAdmin,
};