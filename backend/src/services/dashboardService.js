const prisma = require('../config/db');

/**
 * Returns tenant-isolated aggregate metrics and recent telemetry for the dashboard.
 */
const getDashboardMetrics = async ({ organizationId, userRole, userId }) => {
  const orgId = Number(organizationId);

  // User filter: if USER, count campaigns assigned to them
  const campaignWhere = {
    organizationId: orgId,
  };
  if (userRole === 'USER') {
    campaignWhere.assignments = {
      some: {
        userId: Number(userId),
      },
    };
  }

  const [usersCount, campaignsCount, openEventsCount, criticalEventsCount, recentAuditLogs] =
    await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.campaign.count({ where: campaignWhere }),
      prisma.securityEvent.count({
        where: {
          organizationId: orgId,
          status: 'OPEN',
        },
      }),
      prisma.securityEvent.count({
        where: {
          organizationId: orgId,
          severity: 'CRITICAL',
        },
      }),
      prisma.auditLog.findMany({
        where: { organizationId: orgId },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

  return {
    users: usersCount,
    campaigns: campaignsCount,
    openEvents: openEventsCount,
    criticalEvents: criticalEventsCount,
    recentActivity: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      description: log.description,
      createdAt: log.createdAt,
      user: log.user ? { name: log.user.name, email: log.user.email, role: log.user.role } : null,
    })),
  };
};

module.exports = {
  getDashboardMetrics,
};
