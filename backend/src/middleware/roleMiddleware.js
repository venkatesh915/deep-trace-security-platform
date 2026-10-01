const { errorResponse } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role restrictions at the route level.
 * 
 * @param  {...string} allowedRoles - List of permitted roles (e.g. 'ADMIN', 'MANAGER')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, 'Unauthorized: User identity not found.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Forbidden: Role '${req.user.role}' lacks sufficient permissions to access this resource.`
      );
    }

    next();
  };
};

module.exports = authorizeRoles;
