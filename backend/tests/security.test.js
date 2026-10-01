const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { signToken } = require('../src/utils/jwt');

// Mock Prisma Client
jest.mock('../src/config/db', () => {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaignUser: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    securityEvent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(true),
  };
});

const prismaMock = require('../src/config/db');

describe('Deep Trace Cybernetics — Security & RBAC Test Suite', () => {
  let tenant1AdminToken;
  let tenant1UserToken;
  let tenant2AdminToken;

  const tenant1AdminUser = {
    id: 1,
    name: 'Aarav Sharma',
    email: 'admin@tenant1.com',
    role: 'ADMIN',
    organizationId: 1,
    organization: { id: 1, name: 'CyberSecure India' },
  };

  const tenant1RegularUser = {
    id: 3,
    name: 'Rohan Gupta',
    email: 'user@tenant1.com',
    role: 'USER',
    organizationId: 1,
    organization: { id: 1, name: 'CyberSecure India' },
  };

  const tenant2AdminUser = {
    id: 4,
    name: 'Sarah Jenkins',
    email: 'admin@tenant2.com',
    role: 'ADMIN',
    organizationId: 2,
    organization: { id: 2, name: 'DeepShield Labs' },
  };

  beforeAll(() => {
    // Generate valid JWT tokens for test roles
    tenant1AdminToken = signToken({
      userId: tenant1AdminUser.id,
      organizationId: tenant1AdminUser.organizationId,
      role: tenant1AdminUser.role,
      email: tenant1AdminUser.email,
      name: tenant1AdminUser.name,
    });

    tenant1UserToken = signToken({
      userId: tenant1RegularUser.id,
      organizationId: tenant1RegularUser.organizationId,
      role: tenant1RegularUser.role,
      email: tenant1RegularUser.email,
      name: tenant1RegularUser.name,
    });

    tenant2AdminToken = signToken({
      userId: tenant2AdminUser.id,
      organizationId: tenant2AdminUser.organizationId,
      role: tenant2AdminUser.role,
      email: tenant2AdminUser.email,
      name: tenant2AdminUser.name,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TEST 1: Login
  describe('1. Authentication Tests', () => {
    it('should successfully log in and return a JWT with tenant information', async () => {
      const plainPassword = 'Admin@123';
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Aarav Sharma',
        email: 'admin@tenant1.com',
        passwordHash,
        role: 'ADMIN',
        organizationId: 1,
        organization: { id: 1, name: 'CyberSecure India' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@tenant1.com', password: plainPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('admin@tenant1.com');
      expect(res.body.data.user.organizationId).toBe(1);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    // TEST 2: Invalid password
    it('should reject login with invalid password and return 401', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword@123', 10);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Aarav Sharma',
        email: 'admin@tenant1.com',
        passwordHash,
        role: 'ADMIN',
        organizationId: 1,
        organization: { id: 1, name: 'CyberSecure India' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@tenant1.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    // TEST 3: Protected API without JWT
    it('should reject requests without a JWT token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/campaigns');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // TEST 4 & 5: RBAC Tests
  describe('2. Role-Based Access Control (RBAC) Tests', () => {
    it('should allow ADMIN to access audit logs (200 OK)', async () => {
      prismaMock.auditLog.count.mockResolvedValue(1);
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 1,
          action: 'LOGIN',
          entity: 'User',
          entityId: '1',
          description: 'Login successful',
          createdAt: new Date(),
          user: { id: 1, name: 'Admin', email: 'admin@tenant1.com', role: 'ADMIN' },
        },
      ]);

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${tenant1AdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid USER role from accessing audit logs with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${tenant1UserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/lacks sufficient permissions/i);
    });

    it('should forbid non-ADMIN from accessing user management routes with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tenant1UserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // TEST 6: Campaign Creation & Status Transition Validation
  describe('3. Campaign Operations & Status Transition', () => {
    it('should create campaign scoped to caller organizationId from JWT', async () => {
      prismaMock.campaign.create.mockResolvedValue({
        id: 105,
        name: 'New Security Initiative',
        description: 'Test Campaign',
        status: 'DRAFT',
        organizationId: 1,
        createdBy: 1,
        creator: { id: 1, name: 'Admin', email: 'admin@tenant1.com' },
        assignments: [],
      });

      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${tenant1AdminToken}`)
        .send({
          name: 'New Security Initiative',
          description: 'Test Campaign',
          // Malicious attempt to spoof organization ID in body should be ignored
          organizationId: 9999,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Verify Prisma was called with organizationId: 1 (from JWT), NOT 9999
      expect(prismaMock.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 1,
            createdBy: 1,
          }),
        })
      );
    });

    it('should reject invalid status transition (e.g., COMPLETED -> ACTIVE) with 400 Bad Request', async () => {
      prismaMock.campaign.findFirst.mockResolvedValue({
        id: 103,
        name: 'Privileged Access Audit',
        status: 'COMPLETED',
        organizationId: 1,
      });

      const res = await request(app)
        .patch('/api/campaigns/103')
        .set('Authorization', `Bearer ${tenant1AdminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid status transition/i);
    });
  });

  // TEST 7, 8 & 9: Cross-Tenant Security Isolation (IDOR Prevention)
  describe('4. Strict Multi-Tenant Isolation & Cross-Tenant Defense', () => {
    // TEST 7: Tenant A cannot access Tenant B campaign
    it('should return 404 Not Found when Tenant 1 tries to GET Tenant 2 campaign (ID 201)', async () => {
      // Prisma findFirst returns null because query scopes to organizationId: 1
      prismaMock.campaign.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/campaigns/201')
        .set('Authorization', `Bearer ${tenant1AdminToken}`);

      // Must return 404, never disclosing that campaign 201 exists under Tenant 2
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/campaign not found/i);
      expect(prismaMock.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 201,
            organizationId: 1, // Scoped to caller tenant!
          }),
        })
      );
    });

    // TEST 8: Tenant A cannot update Tenant B campaign
    it('should return 404 Not Found when Tenant 1 tries to PATCH Tenant 2 campaign (ID 201)', async () => {
      prismaMock.campaign.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/campaigns/201')
        .set('Authorization', `Bearer ${tenant1AdminToken}`)
        .send({ name: 'Hacked Campaign Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(prismaMock.campaign.update).not.toHaveBeenCalled();
    });

    // TEST 9: Tenant A cannot assign Tenant B user
    it('should reject assigning a user from Tenant 2 to a Tenant 1 campaign', async () => {
      // Campaign 101 belongs to Tenant 1
      prismaMock.campaign.findFirst.mockResolvedValue({
        id: 101,
        organizationId: 1,
        name: 'Tenant 1 Campaign',
      });

      // Target user (ID 6) is in Tenant 2, so finding within Tenant 1 returns null
      prismaMock.user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/campaigns/101/users/6')
        .set('Authorization', `Bearer ${tenant1AdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/user not found in your organization/i);
      expect(prismaMock.campaignUser.create).not.toHaveBeenCalled();
    });
  });
});
