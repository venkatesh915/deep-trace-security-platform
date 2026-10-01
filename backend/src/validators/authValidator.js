const { errorResponse } = require('../utils/apiResponse');

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return errorResponse(res, 400, 'Validation Error: Email is required.');
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return errorResponse(res, 400, 'Validation Error: Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return errorResponse(res, 400, 'Validation Error: Password is required.');
  }

  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse(res, 400, 'Validation Error: Name is required and must be at least 2 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return errorResponse(res, 400, 'Validation Error: A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return errorResponse(res, 400, 'Validation Error: Password must be at least 6 characters long.');
  }

  if (role && !['ADMIN', 'MANAGER', 'USER'].includes(role)) {
    return errorResponse(res, 400, 'Validation Error: Role must be ADMIN, MANAGER, or USER.');
  }

  next();
};

module.exports = {
  validateLogin,
  validateRegister,
};
