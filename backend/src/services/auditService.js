const prisma = require('../config/db');

/**
 * Reusable audit logging function.
 * Automatically ties the action to the authenticated tenant organization.
 * 
 * @param {Object} params
 * @param {number} params.organizationId - Mandatory tenant ID
 * @param {number|null} [params.userId] - User performing the action (if known)
 * @param {string} params.action - Action string (e.g., LOGIN, CREATE_CAMPAIGN, ASSIGN_USER)
 * @param {string} params.entity - Entity name (e.g., User, Campaign, SecurityEvent)
 * @param {string|number|null} [params.entityId] - Target entity identifier
 * @param {string} params.description - Human-readable explanation of the action
 */
const createAuditLog = async ({
  organizationId,
  userId = null,
  action,
  entity,
  entityId = null,
  description,
}) => {
  if (!organizationId) {
    console.error('AuditLog Error: organizationId is strictly required');
    return null;
  }

  try {
    const log = await prisma.auditLog.create({
      data: {
        organizationId: Number(organizationId),
        userId: userId ? Number(userId) : null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        description,
      },
    });
    return log;
  } catch (error) {
    console.error('Failed to create audit log entry:', error.message);
    // Return null so failed audit logging doesn't crash the primary business operation
    return null;
  }
};

module.exports = {
  createAuditLog,
};
