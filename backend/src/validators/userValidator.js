const { errorResponse } = require('../utils/apiResponse');

const VALID_ROLES = ['ADMIN', 'MANAGER', 'USER'];

const validateCreateUser = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return errorResponse(res, 400, 'Validation Error: Name is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return errorResponse(res, 400, 'Validation Error: A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return errorResponse(res, 400, 'Validation Error: Password must be at least 6 characters long.');
  }

  if (!role || !VALID_ROLES.includes(role)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Role is required and must be one of: ${VALID_ROLES.join(', ')}`
    );
  }

  next();
};

const validateUpdateUser = (req, res, next) => {
  const { name, role } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return errorResponse(res, 400, 'Validation Error: Name cannot be empty.');
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Role must be one of: ${VALID_ROLES.join(', ')}`
    );
  }

  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
};
