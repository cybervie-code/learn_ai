import { ApiError } from '../utils/ApiError.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    // Superadmins bypass all role checks
    if (req.user.platformRole === 'superadmin') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`));
    }
    next();
  };
}

// Platform-level roles
export function requirePlatformRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!req.user.platformRole || !roles.includes(req.user.platformRole)) {
      return next(ApiError.forbidden('Insufficient platform permissions'));
    }
    next();
  };
}

// Allow if user has ANY of the specified platform roles OR college roles (OR logic, not AND)
export function authorizeAny(platformRoles = [], collegeRoles = []) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    // Superadmins always pass
    if (req.user.platformRole === 'superadmin') return next();
    // Check platform role
    if (req.user.platformRole && platformRoles.includes(req.user.platformRole)) return next();
    // Check college role
    if (req.user.role && collegeRoles.includes(req.user.role)) return next();
    return next(ApiError.forbidden('Insufficient permissions'));
  };
}
