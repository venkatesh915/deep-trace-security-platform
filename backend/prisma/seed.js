const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seed for Deep Trace Cybernetics Platform ---');

  // Clear existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany({});
  await prisma.securityEvent.deleteMany({});
  await prisma.campaignUser.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('Cleared existing records.');

  // 1. Seed Organizations
  const org1 = await prisma.organization.create({
    data: {
      id: 1,
      name: 'CyberSecure India',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      id: 2,
      name: 'DeepShield Labs',
    },
  });

  console.log(`Created Organizations: ${org1.name} (ID: ${org1.id}), ${org2.name} (ID: ${org2.id})`);

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);

  // 2. Seed Users for Organization 1 (CyberSecure India)
  const org1Admin = await prisma.user.create({
    data: {
      id: 1,
      organizationId: org1.id,
      name: 'Aarav Sharma (Admin)',
      email: 'admin@tenant1.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const org1Manager = await prisma.user.create({
    data: {
      id: 2,
      organizationId: org1.id,
      name: 'Priya Patel (Manager)',
      email: 'manager@tenant1.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
    },
  });

  const org1User = await prisma.user.create({
    data: {
      id: 3,
      organizationId: org1.id,
      name: 'Rohan Gupta (SecOps User)',
      email: 'user@tenant1.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  // 3. Seed Users for Organization 2 (DeepShield Labs)
  const org2Admin = await prisma.user.create({
    data: {
      id: 4,
      organizationId: org2.id,
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@tenant2.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const org2Manager = await prisma.user.create({
    data: {
      id: 5,
      organizationId: org2.id,
      name: 'Marcus Vance (Manager)',
      email: 'manager@tenant2.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
    },
  });

  const org2User = await prisma.user.create({
    data: {
      id: 6,
      organizationId: org2.id,
      name: 'Elena Rostova (SecOps User)',
      email: 'user@tenant2.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  console.log('Created Users for Tenant 1 & Tenant 2.');

  // 4. Seed Campaigns for Organization 1
  const camp101 = await prisma.campaign.create({
    data: {
      id: 101,
      organizationId: org1.id,
      name: 'Q1 Phishing Simulation & Training',
      description: 'Quarterly spear-phishing resilience drill targeting executive and engineering departments.',
      status: 'ACTIVE',
      createdBy: org1Admin.id,
    },
  });

  const camp102 = await prisma.campaign.create({
    data: {
      id: 102,
      organizationId: org1.id,
      name: 'Endpoint EDR Agent Fleet Rollout',
      description: 'Phased deployment of CrowdStrike EDR telemetry agents across all enterprise endpoints.',
      status: 'DRAFT',
      createdBy: org1Manager.id,
    },
  });

  const camp103 = await prisma.campaign.create({
    data: {
      id: 103,
      organizationId: org1.id,
      name: 'Privileged Access Management (PAM) Audit',
      description: 'Comprehensive audit of root and service accounts credentials rotation across production AWS.',
      status: 'COMPLETED',
      createdBy: org1Admin.id,
    },
  });

  const camp104 = await prisma.campaign.create({
    data: {
      id: 104,
      organizationId: org1.id,
      name: 'Legacy VPN Deprecation Drill',
      description: 'Transition of remote staff to Zero-Trust Network Access (ZTNA).',
      status: 'CANCELLED',
      createdBy: org1Manager.id,
    },
  });

  // 5. Seed Campaigns for Organization 2
  // ID 201 is explicitly requested in Section 35 as belonging to Tenant 2!
  const camp201 = await prisma.campaign.create({
    data: {
      id: 201,
      organizationId: org2.id,
      name: 'Cloud Infrastructure Hardening',
      description: 'Strict IAM policy enforcement and CIS benchmark compliance for GCP & Azure tenants.',
      status: 'ACTIVE',
      createdBy: org2Admin.id,
    },
  });

  const camp202 = await prisma.campaign.create({
    data: {
      id: 202,
      organizationId: org2.id,
      name: 'Zero-Day Incident Response Tabletop',
      description: 'Simulated ransomware containment exercise with the cyber incident response team (CIRT).',
      status: 'DRAFT',
      createdBy: org2Manager.id,
    },
  });

  console.log(`Created Campaigns: Tenant 1 (101, 102, 103, 104) and Tenant 2 (201, 202)`);

  // 6. Seed Campaign User Assignments
  await prisma.campaignUser.create({
    data: {
      campaignId: camp101.id,
      userId: org1User.id,
    },
  });

  await prisma.campaignUser.create({
    data: {
      campaignId: camp102.id,
      userId: org1User.id,
    },
  });

  await prisma.campaignUser.create({
    data: {
      campaignId: camp201.id,
      userId: org2User.id,
    },
  });

  console.log('Created Campaign User assignments.');

  // 7. Seed Security Events for Organization 1
  await prisma.securityEvent.createMany({
    data: [
      {
        id: 1,
        organizationId: org1.id,
        eventType: 'MALWARE',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Trojan.Win64.CobaltStrike beacon detected on workstation WS-DELHI-04.',
      },
      {
        id: 2,
        organizationId: org1.id,
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        description: 'Multiple failed MFA token attempts from TOR exit node IP 185.220.101.5.',
      },
      {
        id: 3,
        organizationId: org1.id,
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        status: 'OPEN',
        description: 'Unauthorized read request against restricted S3 bucket `cybersecure-prod-backups`.',
      },
      {
        id: 4,
        organizationId: org1.id,
        eventType: 'SYSTEM_ALERT',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Public TLS certificate for `auth.cybersecure.in` expires in 5 days.',
      },
      {
        id: 5,
        organizationId: org1.id,
        eventType: 'LOGIN',
        severity: 'LOW',
        status: 'RESOLVED',
        description: 'Security Admin initiated session via MFA-verified hardware security key.',
      },
    ],
  });

  // 8. Seed Security Events for Organization 2
  await prisma.securityEvent.createMany({
    data: [
      {
        id: 6,
        organizationId: org2.id,
        eventType: 'DATA_ACCESS',
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        description: 'Anomalous bulk export of 50,000 telemetry records via API key `ds-prod-svc-09`.',
      },
      {
        id: 7,
        organizationId: org2.id,
        eventType: 'FAILED_LOGIN',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        description: 'Automated SSH brute-force defense triggered against bastion gateway.',
      },
      {
        id: 8,
        organizationId: org2.id,
        eventType: 'SYSTEM_ALERT',
        severity: 'LOW',
        status: 'RESOLVED',
        description: 'Kubernetes node pool kernel security patch automatically applied.',
      },
    ],
  });

  console.log('Created Security Events for both tenants.');

  // 9. Seed Audit Logs for Organization 1
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org1.id,
        userId: org1Admin.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: String(org1Admin.id),
        description: 'User admin@tenant1.com logged in successfully.',
      },
      {
        organizationId: org1.id,
        userId: org1Admin.id,
        action: 'CREATE_CAMPAIGN',
        entity: 'Campaign',
        entityId: String(camp101.id),
        description: 'Created security campaign "Q1 Phishing Simulation & Training".',
      },
      {
        organizationId: org1.id,
        userId: org1Manager.id,
        action: 'ASSIGN_USER',
        entity: 'CampaignUser',
        entityId: `${camp101.id}-${org1User.id}`,
        description: `Assigned user ${org1User.email} to campaign ${camp101.name}.`,
      },
      {
        organizationId: org1.id,
        userId: org1Admin.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: String(org1User.id),
        description: `Provisioned SecOps user ${org1User.email} with USER role.`,
      },
    ],
  });

  // 10. Seed Audit Logs for Organization 2
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org2.id,
        userId: org2Admin.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: String(org2Admin.id),
        description: 'User admin@tenant2.com logged in successfully.',
      },
      {
        organizationId: org2.id,
        userId: org2Admin.id,
        action: 'CREATE_CAMPAIGN',
        entity: 'Campaign',
        entityId: String(camp201.id),
        description: 'Created security campaign "Cloud Infrastructure Hardening".',
      },
    ],
  });

  // 11. Synchronize PostgreSQL autoincrement sequences with explicit seed IDs
  const tables = ['organizations', 'users', 'campaigns', 'security_events', 'audit_logs'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`
    );
  }
  console.log('Synchronized PostgreSQL autoincrement sequences.');

  console.log('Created initial Audit Logs.');
  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
