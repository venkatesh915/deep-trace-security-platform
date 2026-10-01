const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');
const { createAuditLog } = require('./auditService');

/**
 * Authenticates user credentials and issues a signed JWT containing tenant scope.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    // Intentionally generic response to prevent user enumeration
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    // Record failed login in audit logs for tenant security telemetry
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'FAILED_LOGIN',
      entity: 'User',
      entityId: user.id,
      description: `Failed login attempt for account ${user.email} (invalid password credentials).`,
    });

    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token with tenant identity
  const token = signToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  // Record successful login audit log
  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    description: `User ${user.email} (${user.role}) logged in successfully.`,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    },
  };
};

/**
 * Registers a new user within a tenant.
 */
const register = async ({ name, email, password, role = 'USER', organizationId }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Verify target organization exists
  const org = await prisma.organization.findUnique({
    where: { id: Number(organizationId) },
  });

  if (!org) {
    const error = new Error('Specified organization does not exist.');
    error.statusCode = 404;
    throw error;
  }

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
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      organizationId: Number(organizationId),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
    },
  });

  // Record audit log
  await createAuditLog({
    organizationId: newUser.organizationId,
    userId: newUser.id,
    action: 'CREATE_USER',
    entity: 'User',
    entityId: newUser.id,
    description: `New user ${newUser.email} registered under organization ${org.name}.`,
  });

  return newUser;
};

/**
 * Gets current authenticated user profile
 */
const getCurrentUser = async (userId, organizationId) => {
  const user = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      organizationId: Number(organizationId),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
    createdAt: user.createdAt,
  };
};

module.exports = {
  login,
  register,
  getCurrentUser,
};
