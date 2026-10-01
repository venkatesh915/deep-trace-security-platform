const prisma = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, action, entity, search } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      organizationId: Number(req.user.organizationId),
    };

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entity && entity !== 'ALL') {
      where.entity = entity;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { action: { contains: term, mode: 'insensitive' } },
        { entity: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return successResponse(
      res,
      200,
      'Audit logs retrieved successfully',
      data,
      {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
