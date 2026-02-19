import { ApiError } from './error.js';

const ADMIN_ROLE = 'admin';

const resolveUserRole = (req) => {
  const candidate =
    req.userRole ??
    req.user?.role ??
    req.auth?.role ??
    req.role;

  if (typeof candidate !== 'string') return null;
  return candidate.toLowerCase();
};

export const verifyAdmin = (req, res, next) => {
  const role = resolveUserRole(req);

  if (!role || role !== ADMIN_ROLE) {
    return next(new ApiError(403, 'Admin access required'));
  }

  return next();
};
