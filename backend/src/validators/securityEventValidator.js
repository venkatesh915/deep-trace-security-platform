const { errorResponse } = require('../utils/apiResponse');

const VALID_EVENT_TYPES = [
  'LOGIN',
  'FAILED_LOGIN',
  'SUSPICIOUS_ACTIVITY',
  'UNAUTHORIZED_ACCESS',
  'MALWARE',
  'DATA_ACCESS',
  'SYSTEM_ALERT',
];

const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED'];

const validateCreateSecurityEvent = (req, res, next) => {
  const { eventType, severity, status, description } = req.body;

  if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`
    );
  }

  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Severity must be one of: ${VALID_SEVERITIES.join(', ')}`
    );
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Status must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return errorResponse(res, 400, 'Validation Error: Event description is required.');
  }

  next();
};

const validateUpdateSecurityEvent = (req, res, next) => {
  const { status, severity } = req.body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Status must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  if (severity !== undefined && !VALID_SEVERITIES.includes(severity)) {
    return errorResponse(
      res,
      400,
      `Validation Error: Severity must be one of: ${VALID_SEVERITIES.join(', ')}`
    );
  }

  next();
};

module.exports = {
  validateCreateSecurityEvent,
  validateUpdateSecurityEvent,
  VALID_EVENT_TYPES,
  VALID_SEVERITIES,
  VALID_STATUSES,
};
