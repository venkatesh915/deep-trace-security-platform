const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return successResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizationId } = req.body;
    // If request has authenticated user and no org provided, use user's org; else provided org
    const targetOrgId = organizationId || (req.user && req.user.organizationId);
    
    if (!targetOrgId) {
      return errorResponse(res, 400, 'Validation Error: organizationId is required.');
    }

    const newUser = await authService.register({
      name,
      email,
      password,
      role: role || 'USER',
      organizationId: targetOrgId,
    });

    return successResponse(res, 201, 'User registered successfully', newUser);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id, req.user.organizationId);
    return successResponse(res, 200, 'Current user profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
};
