const prisma = require('../config/db');
const { createAuditLog } = require('./auditService');

/**
 * Retrieves paginated security events strictly scoped to authenticated tenant.
 */
const getSecurityEvents = async ({
  organizationId,
  page = 1,
  limit = 10,
  severity,
  status,
  eventType,
  search = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    organizationId: Number(organizationId),
  };

  if (severity && severity !== 'ALL') {
    where.severity = severity;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (eventType && eventType !== 'ALL') {
    where.eventType = eventType;
  }

  if (search && search.trim()) {
    where.description = {
      contains: search.trim(),
      mode: 'insensitive',
    };
  }

  const allowedSortFields = ['createdAt', 'severity', 'status', 'eventType'];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, data] = await Promise.all([
    prisma.securityEvent.count({ where }),
    prisma.securityEvent.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [finalSortBy]: finalSortOrder },
    }),
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves a single security event by ID with strict tenant isolation.
 */
const getSecurityEventById = async ({ eventId, organizationId }) => {
  const event = await prisma.securityEvent.findFirst({
    where: {
      id: Number(eventId),
      organizationId: Number(organizationId),
    },
  });

  if (!event) {
    const error = new Error('Security event not found.');
    error.statusCode = 404;
    throw error;
  }

  return event;
};

/**
 * Creates a security event tied to authenticated tenant.
 */
const createSecurityEvent = async ({ organizationId, userId, eventType, severity, status = 'OPEN', description }) => {
  const event = await prisma.securityEvent.create({
    data: {
      organizationId: Number(organizationId),
      eventType,
      severity,
      status: status || 'OPEN',
      description: description.trim(),
    },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: 'CREATE_EVENT',
    entity: 'SecurityEvent',
    entityId: event.id,
    description: `Reported ${event.severity} security event: ${event.eventType}.`,
  });

  return event;
};

/**
 * Updates a security event status or severity.
 */
const updateSecurityEvent = async ({ eventId, organizationId, userId, updateData }) => {
  const existingEvent = await prisma.securityEvent.findFirst({
    where: {
      id: Number(eventId),
      organizationId: Number(organizationId),
    },
  });

  if (!existingEvent) {
    const error = new Error('Security event not found.');
    error.statusCode = 404;
    throw error;
  }

  const updatedEvent = await prisma.securityEvent.update({
    where: { id: existingEvent.id },
    data: {
      status: updateData.status || undefined,
      severity: updateData.severity || undefined,
      description: updateData.description ? updateData.description.trim() : undefined,
    },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: 'UPDATE_EVENT',
    entity: 'SecurityEvent',
    entityId: updatedEvent.id,
    description: `Updated security event status to ${updatedEvent.status}.`,
  });

  return updatedEvent;
};

module.exports = {
  getSecurityEvents,
  getSecurityEventById,
  createSecurityEvent,
  updateSecurityEvent,
};
