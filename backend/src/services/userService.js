const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { createAuditLog } = require('./auditService');

/**
 * Retrieves all users in the authenticated organization (excluding passwordHash).
 */
const getUsers = async ({ organizationId, page = 1, limit = 20, search = '' }) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    organizationId: Number(organizationId),
  };

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
 * Retrieves a user by ID within the organization.
 */
const getUserById = async ({ userId, organizationId }) => {
  const user = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      organizationId: Number(organizationId),
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Creates a new user within the caller's organization.
 */
const createUser = async ({ organizationId, adminUserId, name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      organizationId: Number(organizationId),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'USER',
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    organizationId,
    userId: adminUserId,
    action: 'CREATE_USER',
    entity: 'User',
    entityId: newUser.id,
    description: `Admin created user ${newUser.email} with role ${newUser.role}.`,
  });

  return newUser;
};

/**
 * Updates a user within the caller's organization.
 */
const updateUser = async ({ userId, organizationId, adminUserId, updateData }) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      organizationId: Number(organizationId),
    },
  });

  if (!existingUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const dataToUpdate = {};
  if (updateData.name) dataToUpdate.name = updateData.name.trim();
  if (updateData.role) dataToUpdate.role = updateData.role;

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: dataToUpdate,
    select: {
      id: true,
      organizationId: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    organizationId,
    userId: adminUserId,
    action: 'UPDATE_USER',
    entity: 'User',
    entityId: updatedUser.id,
    description: `Admin updated user ${updatedUser.email}. Role: ${updatedUser.role}.`,
  });

  return updatedUser;
};

/**
 * Deletes a user within the caller's organization.
 */
const deleteUser = async ({ userId, organizationId, adminUserId }) => {
  const targetId = Number(userId);

  if (targetId === Number(adminUserId)) {
    const error = new Error('Self-deletion is prohibited for administrator accounts.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      id: targetId,
      organizationId: Number(organizationId),
    },
  });

  if (!existingUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({
    where: { id: targetId },
  });

  await createAuditLog({
    organizationId,
    userId: adminUserId,
    action: 'DELETE_USER',
    entity: 'User',
    entityId: targetId,
    description: `Admin deleted user ${existingUser.email} (ID: ${targetId}).`,
  });

  return { id: targetId };
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
