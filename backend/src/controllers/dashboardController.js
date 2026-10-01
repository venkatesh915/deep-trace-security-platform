const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

const getDashboardData = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardMetrics({
      organizationId: req.user.organizationId,
      userRole: req.user.role,
      userId: req.user.id,
    });
    return successResponse(res, 200, 'Dashboard metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
