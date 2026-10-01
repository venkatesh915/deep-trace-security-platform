# Deep Trace Cybernetics — Security Platform Backend

Production-style multi-tenant security management backend built with Node.js, Express, PostgreSQL, and Prisma ORM.

## Features

- **JWT Authentication & Stateless Tokens**: Secure claims containing `userId`, `organizationId`, and `role`.
- **Bcrypt Password Security**: Passwords salted and hashed with 10 rounds; plaintext passwords never stored or returned.
- **Strict Multi-Tenant Isolation**: Every database query scopes to `req.user.organizationId` extracted from the verified JWT.
- **IDOR Prevention**: Resource lookups enforce both `resourceId` AND `organizationId`. Cross-tenant requests return `404 Not Found` without disclosing existence.
- **Role-Based Access Control (RBAC)**: Enforced via reusable middleware for `ADMIN`, `MANAGER`, and `USER` roles.
- **State Transition Guard**: Campaign status transitions strictly validated (e.g. `COMPLETED` cannot revert to `ACTIVE`).
- **Comprehensive Audit Trail**: Security actions (`LOGIN`, `FAILED_LOGIN`, `CREATE_CAMPAIGN`, etc.) logged with tenant context.
- **Interactive OpenAPI / Swagger Documentation**: Available at `/api-docs`.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Supabase PostgreSQL connection string in `DATABASE_URL`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
JWT_SECRET="super-secure-production-random-secret-key-32-chars-min"
JWT_EXPIRES_IN="1h"
FRONTEND_URL="http://localhost:5173"
```

### 3. Initialize Database & Seed

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations or push schema to Supabase PostgreSQL
npx prisma db push

# Seed initial organizations, users, campaigns, events, and audit logs
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

API will be running on `http://localhost:5000`.
Swagger Documentation: `http://localhost:5000/api-docs`.
Health Check: `http://localhost:5000/api/health`.

### 5. Run Automated Security Tests

```bash
npm test
```
