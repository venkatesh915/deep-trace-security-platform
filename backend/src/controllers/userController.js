const userService = require('../services/userService');
const { successResponse } = require('../utils/apiResponse');

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await userService.getUsers({
      organizationId: req.user.organizationId,
      page,
      limit,
      search,
    });
    return successResponse(res, 200, 'Users retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById({
      userId: id,
      organizationId: req.user.organizationId,
    });
    return successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await userService.createUser({
      organizationId: req.user.organizationId,
      adminUserId: req.user.id,
      name,
      email,
      password,
      role,
    });
    return successResponse(res, 201, 'User created successfully', user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    const updated = await userService.updateUser({
      userId: id,
      organizationId: req.user.organizationId,
      adminUserId: req.user.id,
      updateData: { name, role },
    });
    return successResponse(res, 200, 'User updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser({
      userId: id,
      organizationId: req.user.organizationId,
      adminUserId: req.user.id,
    });
    return successResponse(res, 200, 'User deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
