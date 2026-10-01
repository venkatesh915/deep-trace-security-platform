const prisma = require('../config/db');
const { createAuditLog } = require('./auditService');
const { isValidStatusTransition } = require('../validators/campaignValidator');

/**
 * Creates a new campaign scoped strictly to the authenticated user's organization.
 */
const createCampaign = async ({ organizationId, createdBy, name, description, status = 'DRAFT' }) => {
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: Number(organizationId),
      createdBy: Number(createdBy),
      name: name.trim(),
      description: description ? description.trim() : null,
      status: status || 'DRAFT',
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  // Record audit trail
  await createAuditLog({
    organizationId,
    userId: createdBy,
    action: 'CREATE_CAMPAIGN',
    entity: 'Campaign',
    entityId: campaign.id,
    description: `Created campaign "${campaign.name}" with status ${campaign.status}.`,
  });

  return campaign;
};

/**
 * Retrieves a paginated list of campaigns scoped to organization.
 * For role 'USER', automatically restricts results to campaigns assigned to that user.
 */
const getCampaigns = async ({
  organizationId,
  userRole,
  userId,
  page = 1,
  limit = 10,
  search = '',
  status,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  // Build where conditions
  const where = {
    organizationId: Number(organizationId),
  };

  // If user role is USER, restrict to assigned campaigns
  if (userRole === 'USER') {
    where.assignments = {
      some: {
        userId: Number(userId),
      },
    };
  }

  // Filter by status if provided
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // Search by name or description
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Allowed sort fields
  const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'status'];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, data] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [finalSortBy]: finalSortOrder },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
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
 * Retrieves a single campaign by ID.
 * Enforces strict tenant isolation and role assignment checks.
 * Returns 404 if not found in the tenant's scope.
 */
const getCampaignById = async ({ campaignId, organizationId, userRole, userId }) => {
  const where = {
    id: Number(campaignId),
    organizationId: Number(organizationId),
  };

  // If role is USER, ensure they are assigned to this campaign
  if (userRole === 'USER') {
    where.assignments = {
      some: {
        userId: Number(userId),
      },
    };
  }

  const campaign = await prisma.campaign.findFirst({
    where,
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  return campaign;
};

/**
 * Updates a campaign with multi-tenant check and status transition validation.
 */
const updateCampaign = async ({ campaignId, organizationId, userId, updateData }) => {
  // First, verify campaign exists within this organization
  const existingCampaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(organizationId),
    },
  });

  if (!existingCampaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  // Validate status transition if status update requested
  if (updateData.status && updateData.status !== existingCampaign.status) {
    const isValid = isValidStatusTransition(existingCampaign.status, updateData.status);
    if (!isValid) {
      const error = new Error(
        `Invalid status transition: Cannot transition from ${existingCampaign.status} to ${updateData.status}. Allowed transitions from ${existingCampaign.status} are: ${
          existingCampaign.status === 'DRAFT'
            ? 'ACTIVE, CANCELLED'
            : existingCampaign.status === 'ACTIVE'
            ? 'COMPLETED, CANCELLED'
            : 'none (terminal state)'
        }.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id: existingCampaign.id },
    data: {
      name: updateData.name ? updateData.name.trim() : undefined,
      description: updateData.description !== undefined ? updateData.description : undefined,
      status: updateData.status || undefined,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  // Audit log
  await createAuditLog({
    organizationId,
    userId,
    action: 'UPDATE_CAMPAIGN',
    entity: 'Campaign',
    entityId: updatedCampaign.id,
    description: `Updated campaign "${updatedCampaign.name}". Status: ${updatedCampaign.status}.`,
  });

  return updatedCampaign;
};

/**
 * Deletes a campaign with strict multi-tenant check.
 */
const deleteCampaign = async ({ campaignId, organizationId, userId }) => {
  const existingCampaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(organizationId),
    },
  });

  if (!existingCampaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.campaign.delete({
    where: { id: existingCampaign.id },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: 'DELETE_CAMPAIGN',
    entity: 'Campaign',
    entityId: campaignId,
    description: `Deleted campaign "${existingCampaign.name}" (ID: ${campaignId}).`,
  });

  return { id: Number(campaignId) };
};

/**
 * Assigns a user to a campaign with cross-tenant isolation enforcement.
 * Both campaign and user MUST belong to the caller's organization.
 */
const assignUserToCampaign = async ({ campaignId, targetUserId, organizationId, actionUserId }) => {
  // 1. Verify campaign belongs to current tenant
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(organizationId),
    },
  });

  if (!campaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify target user belongs to the SAME tenant
  const targetUser = await prisma.user.findFirst({
    where: {
      id: Number(targetUserId),
      organizationId: Number(organizationId), // MUST match caller's organization!
    },
  });

  if (!targetUser) {
    const error = new Error('User not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Check if already assigned
  const existingAssignment = await prisma.campaignUser.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: targetUser.id,
      },
    },
  });

  if (existingAssignment) {
    const error = new Error('User is already assigned to this campaign.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Create assignment
  const assignment = await prisma.campaignUser.create({
    data: {
      campaignId: campaign.id,
      userId: targetUser.id,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 5. Audit log
  await createAuditLog({
    organizationId,
    userId: actionUserId,
    action: 'ASSIGN_USER',
    entity: 'CampaignUser',
    entityId: `${campaign.id}-${targetUser.id}`,
    description: `Assigned user ${targetUser.email} to campaign "${campaign.name}".`,
  });

  return assignment;
};

/**
 * Removes a user from a campaign.
 */
const removeUserFromCampaign = async ({ campaignId, targetUserId, organizationId, actionUserId }) => {
  // Verify campaign belongs to tenant
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(organizationId),
    },
  });

  if (!campaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingAssignment = await prisma.campaignUser.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: Number(targetUserId),
      },
    },
  });

  if (!existingAssignment) {
    const error = new Error('User assignment not found for this campaign.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.campaignUser.delete({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: Number(targetUserId),
      },
    },
  });

  await createAuditLog({
    organizationId,
    userId: actionUserId,
    action: 'REMOVE_USER',
    entity: 'CampaignUser',
    entityId: `${campaign.id}-${targetUserId}`,
    description: `Removed user (ID: ${targetUserId}) from campaign "${campaign.name}".`,
  });

  return { message: 'User removed from campaign successfully' };
};

/**
 * Lists all users assigned to a campaign.
 */
const getCampaignUsers = async ({ campaignId, organizationId }) => {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(organizationId),
    },
  });

  if (!campaign) {
    const error = new Error('Campaign not found.');
    error.statusCode = 404;
    throw error;
  }

  const assignments = await prisma.campaignUser.findMany({
    where: { campaignId: campaign.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  });

  return assignments.map((a) => ({
    ...a.user,
    assignedAt: a.assignedAt,
  }));
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  assignUserToCampaign,
  removeUserFromCampaign,
  getCampaignUsers,
};
