import { ApiError } from '../utils/ApiError.js';

// Ensures the user belongs to a college tenant and sets req.tenantId
export function requireTenant(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  if (req.user.platformRole === 'superadmin') {
    req.tenantId = null;
    return next();
  }
  if (!req.user.college) {
    return next(ApiError.forbidden('You are not associated with any college'));
  }
  req.tenantId = req.user.college;
  next();
}

// For routes that accept a collegeId param, ensure the user can access that college
export function checkCollegeAccess(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  if (req.user.platformRole === 'superadmin') return next();
  const requestedCollege = req.params.collegeId || req.params.id || req.body.college;
  if (!requestedCollege) return next();
  if (String(req.user.college) !== String(requestedCollege)) {
    return next(ApiError.forbidden('You do not have access to this college'));
  }
  next();
}
