const securityEventService = require('../services/securityEventService');
const { successResponse } = require('../utils/apiResponse');

const getSecurityEvents = async (req, res, next) => {
  try {
    const { page, limit, severity, status, eventType, search, sortBy, sortOrder } = req.query;
    const result = await securityEventService.getSecurityEvents({
      organizationId: req.user.organizationId,
      page,
      limit,
      severity,
      status,
      eventType,
      search,
      sortBy,
      sortOrder,
    });
    return successResponse(res, 200, 'Security events retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getSecurityEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await securityEventService.getSecurityEventById({
      eventId: id,
      organizationId: req.user.organizationId,
    });
    return successResponse(res, 200, 'Security event retrieved successfully', event);
  } catch (error) {
    next(error);
  }
};

const createSecurityEvent = async (req, res, next) => {
  try {
    const { eventType, severity, status, description } = req.body;
    const event = await securityEventService.createSecurityEvent({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      eventType,
      severity,
      status,
      description,
    });
    return successResponse(res, 201, 'Security event logged successfully', event);
  } catch (error) {
    next(error);
  }
};

const updateSecurityEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, severity, description } = req.body;
    const updated = await securityEventService.updateSecurityEvent({
      eventId: id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      updateData: { status, severity, description },
    });
    return successResponse(res, 200, 'Security event updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSecurityEvents,
  getSecurityEventById,
  createSecurityEvent,
  updateSecurityEvent,
};
