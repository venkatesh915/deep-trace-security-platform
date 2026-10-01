const { errorResponse } = require('../utils/apiResponse');

const VALID_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

/**
 * Validates campaign state transitions according to section 16:
 * - DRAFT -> ACTIVE, CANCELLED
 * - ACTIVE -> COMPLETED, CANCELLED
 * - COMPLETED -> no changes
 * - CANCELLED -> no changes
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true; // No change is permissible

  const allowedTransitions = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};

const validateCreateCampaign = (req, res, next) => {
  const { name, description, status } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return errorResponse(res, 400, 'Validation Error: Campaign name is required.');
  }

  if (name.trim().length > 150) {
    return errorResponse(res, 400, 'Validation Error: Campaign name must be 150 characters or fewer.');
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  next();
};

const validateUpdateCampaign = (req, res, next) => {
  const { name, status } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return errorResponse(res, 400, 'Validation Error: Campaign name cannot be empty.');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  next();
};

module.exports = {
  isValidStatusTransition,
  validateCreateCampaign,
  validateUpdateCampaign,
  VALID_STATUSES,
};
