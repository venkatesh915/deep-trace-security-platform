# DEEP TRACE CYBERNETICS — MULTI-TENANT SECURITY MANAGEMENT PLATFORM

A production-style, interview-ready, zero-trust **Multi-Tenant Security Management Platform** built for the **Deep Trace Cybernetics** Full-Stack Technical Assessment.

---

## 1. Executive Summary & Overview

Modern security operations platforms must manage sensitive security postures, campaign initiatives, incident telemetry, and compliance audits across multiple corporate entities (tenants). In a multi-tenant SaaS architecture, data leakage across tenant boundaries is a critical vulnerability.

This platform enforces **Zero-Trust Multi-Tenancy**:
* **Identity from Token Only**: Client requests can never dictate `organizationId` or `role`. The verified claims from the signed JWT strictly define tenant identity.
* **IDOR Elimination**: Every database query scopes to `organizationId`. Attempting to access or mutate another tenant's resource returns `404 Not Found`, giving zero indication of the resource's existence.
* **Deterministic RBAC**: Enforced by server-side middleware at every route level across `ADMIN`, `MANAGER`, and `USER` roles.
* **Campaign State Transitions**: Deterministic state machine validation prevents invalid status progressions.
* **Immutable Audit Trail**: All authentication events, CRUD actions, and user assignments are persisted with tenant attribution.

---

## 2. Architecture & Data Flow

```text
 ┌────────────────────────────────────────────────────────┐
 │            React.js + Vite (Frontend SPA)              │
 │  - Session State & Tenant Context via AuthContext      │
 │  - Centralized Axios Interceptor (Bearer Token Header) │
 │  - Role-Aware Dynamic UI & Security Lab Modal          │
 └──────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           Node.js + Express REST API Gateway           │
 │  - Helmet Security Headers & CORS origin control       │
 │  - Express Rate Limiting (Brute-force protection)      │
 │  - JWT Auth Middleware (Extracts req.user)             │
 │  - Reusable RBAC Middleware (authorizeRoles)           │
 │  - Centralized Error Handler & Structured Responses    │
 └──────────────────────────┬─────────────────────────────┘
                            │ Parameterized ORM Queries
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               Prisma ORM (Data Layer)                  │
 │  - Scoped Queries: { id, organizationId: req.user.org }│
 │  - Foreign Key Constraints & Cascade Isolation         │
 │  - Database-level Compound Indexes                     │
 └──────────────────────────┬─────────────────────────────┘
                            │ PostgreSQL Wire Protocol
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │        Supabase PostgreSQL (Hosted Database)          │
 │  - organizations, users, campaigns, campaign_users     │
 │  - security_events, audit_logs                         │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technologies | Key Decisions & Standards |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Axios, CSS Modules | JavaScript (clean, interview-friendly), Lucide icons, responsive layout |
| **Backend** | Node.js, Express.js, JWT, BcryptJS, Helmet, Rate Limit | Layered MVC (routes, controllers, services, validators) |
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM | Parameterized queries, foreign keys, compound indexes, seed scripts |
| **Testing** | Jest, Supertest | 100% pass rate across auth, RBAC, state machine, and cross-tenant tests |
| **Documentation** | Swagger / OpenAPI 3.0 | Interactive API documentation at `/api-docs` |
| **Containerization** | Docker, Docker Compose | Optional local development with PostgreSQL 16 container |

---

## 4. Repository Structure

```text
deep-trace-security-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/             # Database client (db.js) & Swagger config (swagger.js)
│   │   ├── controllers/        # Request coordinators (auth, campaign, event, user, audit, dashboard)
│   │   ├── middleware/         # authMiddleware, roleMiddleware, rateLimiter, errorMiddleware
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & tenant-scoped Prisma operations
│   │   ├── utils/              # apiResponse standardizer & jwt signing/verification
│   │   ├── validators/         # Input validators & campaign state machine guards
│   │   ├── app.js              # Express application assembly
│   │   └── server.js           # HTTP listener with graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models, enums, constraints, indexes
│   │   └── seed.js             # Multi-tenant seed dataset (Tenant 1 & Tenant 2)
│   ├── tests/
│   │   └── security.test.js    # Comprehensive automated test suite
│   ├── .env.example
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Badge, Modal, StatCard, Pagination, CrossTenantLabModal
│   │   ├── layouts/            # MainLayout (Sidebar, Topbar, Profile footer)
│   │   ├── pages/              # Login, Dashboard, Campaigns, CampaignDetail, Events, Users, AuditLogs
│   │   ├── context/            # AuthContext (JWT storage, role helpers, session management)
│   │   ├── services/           # api.js (Axios instance with Bearer interceptor & error parsing)
│   │   ├── utils/              # formatters.js (Dates, badges, helpers)
│   │   ├── App.jsx             # Route definitions & ProtectedRoute gates
│   │   └── main.jsx            # React root mount
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── docker-compose.yml          # Optional full-stack Docker orchestration
├── .gitignore                  # Strict secret and dependency exclusion
├── .env.example                # Unified environment variables reference
├── package.json                # Root convenience scripts
└── README.md                   # System documentation & technical assessment report
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000

# Supabase or local PostgreSQL connection string:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Long random JWT secret key:
JWT_SECRET="deep-trace-cybernetics-assessment-jwt-secret-key-32-chars-min"

# Token expiration:
JWT_EXPIRES_IN="1h"

# Frontend origin for CORS whitelist:
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL="http://localhost:5000/api"
```

> **Security Note**: Never commit `.env` files. Secrets are never hardcoded in source files.

---

## 6. Installation & Setup Guide

### Option A: Local Run (Standard)

#### Step 1: Install Dependencies

```bash
# In backend directory
cd backend
npm install

# In frontend directory
cd ../frontend
npm install
```

#### Step 2: Configure Database & Run Migrations

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy your PostgreSQL connection string into `backend/.env`.
3. Push schema to Supabase and seed initial test data:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

> **Prisma Deployment Note**: On hosted PostgreSQL databases such as Supabase, `npx prisma db push` is the recommended command as it does not require a direct shadow database connection. If using a local PostgreSQL database with shadow database privileges, `npx prisma migrate dev` can also be used.

#### Step 3: Run the Application

In terminal 1 (Backend):
```bash
cd backend
npm run dev
```
*Backend API will run on `http://localhost:5000`*
*Swagger API Docs: `http://localhost:5000/api-docs`*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend UI will run on `http://localhost:5173`*

---

### Option B: Unified Root Execution

From the project root:
```bash
npm install
npm run dev
```
*Launches both backend and frontend concurrently.*

---

### Option C: Docker Run (Optional)

If Docker Desktop is running on your machine:
```bash
docker compose up -d
```
*Spins up a local PostgreSQL 16 container, builds the Node backend, and serves the frontend on port 5173 with zero manual configuration.*

---

## 7. Demo Credentials Table

The database seed provides two separate organizations with three distinct roles each to make RBAC and multi-tenancy verification effortless:

| Organization (Tenant) | Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant 1** (CyberSecure India) | `ADMIN` | `admin@tenant1.com` | `Admin@123` | Full access: Users, Campaigns, Events, Audit Logs |
| **Tenant 1** (CyberSecure India) | `MANAGER` | `manager@tenant1.com` | `Manager@123` | Manage campaigns, assign users, view events & audit logs |
| **Tenant 1** (CyberSecure India) | `USER` | `user@tenant1.com` | `User@123` | View assigned campaigns and org security events only |
| **Tenant 2** (DeepShield Labs) | `ADMIN` | `admin@tenant2.com` | `Admin@123` | Full access within Tenant 2 |
| **Tenant 2** (DeepShield Labs) | `MANAGER` | `manager@tenant2.com` | `Manager@123` | Manage campaigns within Tenant 2 |
| **Tenant 2** (DeepShield Labs) | `USER` | `user@tenant2.com` | `User@123` | View assigned campaigns in Tenant 2 |

> The login screen contains **1-click quick-fill buttons** for each of these test accounts.

---

## 8. Security Design & Threat Mitigation

### 1. Password Security
* Passwords are salted and hashed using `bcryptjs` with **10 rounds**.
* The `passwordHash` field is stripped in Prisma queries via explicit select projections and is never transmitted to the frontend.
* Login compares credentials using constant-time `bcrypt.compare`.

### 2. Stateless JWT Authentication
* Tokens are signed with `JWT_SECRET` and set to expire (`1h`).
* Payload claims:
  ```json
  {
    "userId": 1,
    "organizationId": 1,
    "role": "ADMIN",
    "email": "admin@tenant1.com",
    "name": "Aarav Sharma"
  }
  ```
* Tokens are verified in `authMiddleware.js`. Missing, invalid, or expired tokens immediately trigger `401 Unauthorized`.

### 3. Role-Based Access Control (RBAC)
* Handled via `authorizeRoles(...roles)` middleware:
  ```javascript
  router.use(authorizeRoles('ADMIN'));
  ```
* If a `USER` role attempts to access `/api/audit-logs` or `/api/users`, the backend immediately aborts and returns `403 Forbidden`.
* Frontend visibility logic is purely for UX convenience; every authorization constraint is enforced on the server.

### 4. Zero-Trust Multi-Tenant Isolation & IDOR Prevention
* **The Golden Rule**: The frontend can **NEVER** provide `organizationId` or `userId`. All data mutations and queries bind to `req.user.organizationId` and `req.user.id`.
* Every resource query enforces compound scoping:
  ```javascript
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(campaignId),
      organizationId: Number(req.user.organizationId) // Enforced tenant boundary
    }
  });
  if (!campaign) {
    return errorResponse(res, 404, 'Campaign not found.');
  }
  ```
* **Why 404 instead of 403?** Returning `403 Forbidden` for a foreign tenant's resource confirms to an attacker that the resource exists (Resource Enumeration / IDOR). Returning `404 Not Found` ensures that the existence of other tenants' data is completely opaque.

### 5. Cross-Tenant Assignment Guard
* When assigning users to campaigns (`POST /api/campaigns/:id/users/:userId`), the service explicitly checks that:
  1. The campaign belongs to `req.user.organizationId`.
  2. The target user belongs to `req.user.organizationId`.
  Attempts by Tenant 1 to enroll a Tenant 2 user are rejected with `404 User not found in your organization`.

### 6. Campaign State Machine Validation
* Status changes follow strict transition rules defined in `campaignValidator.js`:
  * `DRAFT` ➔ `ACTIVE` or `CANCELLED`
  * `ACTIVE` ➔ `COMPLETED` or `CANCELLED`
  * `COMPLETED` ➔ Terminal (no further transitions permitted)
  * `CANCELLED` ➔ Terminal (no further transitions permitted)
* Attempting an illegal transition (e.g. `COMPLETED` ➔ `ACTIVE`) is rejected with `400 Bad Request`.

### 7. SQL Injection & Parameter Tampering
* 100% of database access is performed via Prisma ORM parameterized queries.
* Raw SQL string concatenation is strictly prohibited.
* Input validation ensures numeric parameters (e.g. IDs, pagination limits) are sanitised and bounded (`limit` capped at 100).

---

## 9. Automated Security Tests

The test suite runs with Jest and Supertest (`backend/tests/security.test.js`) and covers all 9 required verification scenarios:

```bash
cd backend
npm test
```

### Verified Test Scenarios:
1. **Login Success**: Verifies valid credentials return signed JWT containing tenant scope.
2. **Invalid Password**: Verifies incorrect password returns `401 Unauthorized` and records audit entry.
3. **Unauthenticated API Access**: Verifies requests missing Bearer token return `401`.
4. **Admin Privileges**: Verifies `ADMIN` access to audit logs and user management returns `200 OK`.
5. **RBAC Rejection**: Verifies `USER` role receives `403 Forbidden` on audit logs and user endpoints.
6. **Campaign Creation Scoping**: Verifies `organizationId` is taken from JWT, ignoring any spoofed body parameters.
7. **State Transition Rejection**: Verifies `COMPLETED` ➔ `ACTIVE` returns `400 Bad Request`.
8. **Cross-Tenant Campaign Access (IDOR)**: Verifies Tenant 1 requesting Tenant 2 Campaign ID 201 returns `404 Not Found`.
9. **Cross-Tenant Campaign Mutation**: Verifies Tenant 1 patching Tenant 2 Campaign ID 201 returns `404 Not Found`.
10. **Cross-Tenant User Assignment**: Verifies assigning Tenant 2 user to Tenant 1 campaign is rejected.

---

## 10. Architectural Deep-Dive Questions (Section 41)

### Q1: How would you scale this platform to 1,000 tenants / 1,000,000 users?

To scale this platform reliably from a prototype to enterprise scale:

1. **Database Indexing & Partitioning**:
   * **Compound Indexes**: Maintain indexes on `(organizationId, createdAt)` and `(organizationId, status)`. Every query uses `organizationId` as the leading index key, ensuring queries only scan the tenant's partition.
   * **Table Partitioning**: Implement PostgreSQL declarative table partitioning by `organizationId` (list or hash partitioning) for high-volume tables like `audit_logs` and `security_events`.
2. **Connection Pooling**:
   * Direct PostgreSQL connections exhaust server memory under high concurrency. Deploy **PgBouncer** or use Supabase's Transaction Pooler (port 6543) with connection pooling limits.
3. **Horizontal API Scaling**:
   * Express instances are completely stateless because session state is encapsulated in JWTs. Deploy API servers in a containerized auto-scaling group (AWS ECS Fargate or Kubernetes) behind an Application Load Balancer.
4. **Distributed Caching (Redis)**:
   * Cache frequently read, low-mutation data (e.g. organization settings, user roles, active campaigns) using tenant-namespaced keys: `tenant:{orgId}:campaigns:active`. Invalidate on write.
5. **Asynchronous Background Processing**:
   * Offload audit logging, security event alerting, and bulk CSV reports to a message broker (BullMQ with Redis or RabbitMQ/AWS SQS). API handlers return `202 Accepted` immediately without blocking on secondary writes.
6. **Read Replicas**:
   * Direct heavy analytical dashboard queries and compliance audit exports to PostgreSQL read replicas, keeping the primary database dedicated to low-latency transactional writes.
7. **Database Isolation Strategy by Tier**:
   * *Shared Database, Shared Schema* (current design) for standard tenants.
   * Provide *Separate Schema* or *Isolated Database instance* for high-compliance enterprise tenants requiring physical data segregation (e.g. HIPAA/FedRAMP).

---

### Q2: How would you handle JWT revocation?

Pure stateless JWTs cannot be revoked server-side before their expiration without introducing state. In high-security platforms, immediate revocation is mandatory for scenarios like password changes, role demotions, or account compromise.

#### Recommended Solutions:

1. **Short-Lived Access Tokens + Refresh Token Rotation**:
   * Access tokens expire in 10–15 minutes.
   * Long-lived refresh tokens (7 days) are stored in `httpOnly` secure cookies and tracked in the database or Redis.
   * When logging out or revoking access, the refresh token is revoked in the database. When the access token expires minutes later, re-authentication fails.

2. **Redis-Backed Denylist (JTI)**:
   * Each issued JWT contains a unique `jti` (JWT ID) claim.
   * Upon explicit logout, add the `jti` to Redis with a TTL matching the token's remaining lifespan.
   * `authMiddleware` checks Redis (`EXISTS blacklist:{jti}`). If present, reject with `401`. Memory cleans up automatically when the TTL expires.

3. **User `tokenVersion` / `securityStamp`**:
   * Add a `tokenVersion Int @default(1)` column to the `User` table.
   * Include `tokenVersion` in the JWT payload.
   * When an admin revokes access or the user resets their password, increment `tokenVersion` in the database.
   * Auth middleware validates `decoded.tokenVersion === dbUser.tokenVersion`. All previously issued tokens are invalidated instantly across all devices.

---

### Q3: How would you troubleshoot production APIs returning many 500 errors?

A structured, 11-step emergency triage procedure:

1. **Isolate Scope & Blast Radius**: Check if the 500 errors affect all tenants or a specific tenant/route (e.g. only `/api/campaigns` vs entire API).
2. **Inspect Structured Application Logs**: Review centralized logs (Datadog, CloudWatch, Sentry). Look for common exceptions:
   * `PrismaClientKnownRequestError` (e.g. connection pool exhaustion, timeout).
   * Unhandled `TypeError: Cannot read properties of undefined`.
3. **Audit Recent Deployments**: Check if a new release was deployed in the last 30 minutes. If errors correlate directly with a new deployment, initiate an immediate rollback to the previous stable container image.
4. **Database Health & Connection Pool**:
   * Check PostgreSQL CPU, RAM, and active connection count in Supabase dashboard.
   * Check for lock contention or long-running transactions (`SELECT * FROM pg_stat_activity WHERE state = 'active'`).
5. **Verify Environment Variables & Secret Rotation**: Ensure external secrets (Supabase credentials, JWT secret, third-party API keys) were not rotated or expired.
6. **Inspect Network & Ingress**: Check load balancer health checks, TLS certificate validity, and reverse proxy (Nginx/Cloudflare) status.
7. **Trace Error by Correlation ID**: Replicate the exact failing request in a staging environment using the logged request headers and sanitized payload.
8. **Dependency Health Check**: Verify third-party services (Supabase status, email provider, SMS gateway) are operational.
9. **Mitigate via Circuit Breakers / Rate Limiting**: If caused by unexpected traffic spikes or scraping, tighten rate limits or activate circuit breakers on non-critical endpoints.
10. **Hotfix & Deploy**: Once root cause is identified and patched with regression tests, deploy fix and verify error rate drops to zero.
11. **Post-Mortem & Alert Refinement**: Write a Blameless Post-Mortem. Add synthetic canary checks and alerts that trigger when 5xx error rate exceeds 1% over 2 minutes.

---

## 11. Interactive Demo Walkthrough (5–10 Minute Interview Sequence)

Follow this sequence to demonstrate all platform features:

### Step 1: Login & Multi-Tenant Context
1. Navigate to `http://localhost:5173/login`.
2. Click the quick-fill button for **🏢 Tenant 1 • Admin** (`admin@tenant1.com`).
3. Click **Sign In**.
4. Point out the top header: **Active Tenant: CyberSecure India (Tenant ID: #1)** and **Multi-Tenant Guard Active**.

### Step 2: Dashboard Metrics & Telemetry
1. Review the dashboard stat cards: Total Users, Active Campaigns, Open Events, Critical Incidents.
2. Note that all metrics reflect strictly Tenant 1 data.
3. Review the **Recent Tenant Activity & Audit Trail** feed showing recent logins and actions.

### Step 3: Campaign Management & State Transitions
1. Click **Campaigns** in the sidebar.
2. Click **New Campaign** and create `"Zero Trust Perimeter Expansion"` with status `DRAFT`.
3. Click the campaign in the list to open **Campaign Details**.
4. Test the state machine guard:
   * Transition `DRAFT` ➔ `ACTIVE` (Succeeds).
   * Transition `ACTIVE` ➔ `COMPLETED` (Succeeds).
   * Notice that once in `COMPLETED`, the selector is disabled because `COMPLETED` is an immutable terminal state.

### Step 4: Campaign User Enrollment
1. In Campaign Details, click **Assign Member**.
2. Select `Rohan Gupta` (a Tenant 1 user) and confirm.
3. Observe the user added to the assigned personnel list.

### Step 5: Security Events & Incidents
1. Click **Security Events** in the sidebar.
2. Filter by `Severity: CRITICAL` to view active CobaltStrike and Ransomware telemetry.
3. Filter by `Status: OPEN`.
4. Click **Update** on an open incident and mark it `INVESTIGATING`.

### Step 6: User Management (Admin Only)
1. Click **Users** in the sidebar.
2. Show the enrolled users and role badges (`ADMIN`, `MANAGER`, `USER`).
3. Click **Provision User** and create a new manager account.

### Step 7: Audit Trail Verification
1. Click **Audit Logs** in the sidebar.
2. Show that every action just taken (Login, Campaign Creation, Status Update, User Assignment) was recorded with timestamp, actor email, and entity ID.

### Step 8: RBAC Verification (Role Restriction)
1. Click **Logout**.
2. Click quick-fill for **🏢 Tenant 1 • User (Restricted)** (`user@tenant1.com`) and login.
3. Notice that **Users** and **Audit Logs** are hidden from the sidebar.
4. Manually navigate in browser URL to `http://localhost:5173/audit-logs`.
5. Observe the **Access Restricted (403 Forbidden)** card.

### Step 9: Cross-Tenant Security Demonstration (The Key Test!)
1. Click **Logout** and re-login as **🏢 Tenant 1 • Admin** (`admin@tenant1.com`).
2. Click the **Cross-Tenant Lab** button in the topbar or sidebar.
3. Target Campaign ID is pre-filled with **`201`** (which belongs to Tenant 2: DeepShield Labs).
4. Select Action: **`GET /api/campaigns/:id`** and click **Execute Cross-Tenant Request**.
5. Observe the result:
   * **HTTP 404 Not Found**
   * Explanation confirms that even with knowledge of Tenant 2's primary key `201`, the resource is invisible.
6. Switch Action to **`PATCH /api/campaigns/:id`** and execute:
   * Returns **HTTP 404 Not Found**.
7. Switch Action to **`POST /api/campaigns/101/users/6`** (Attempting to assign Tenant 2 user to Tenant 1 campaign):
   * Returns **HTTP 404 User not found in your organization**.

---

## 12. API Reference Summary

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT |
| `POST` | `/api/auth/register` | Public | Enrolls a user within specified organization |
| `GET` | `/api/auth/me` | Authenticated | Returns current user profile and tenant details |
| `GET` | `/api/dashboard` | Authenticated | Returns tenant-isolated aggregate metrics |
| `GET` | `/api/campaigns` | Authenticated | Paginated, filtered campaigns (`USER` sees assigned only) |
| `POST` | `/api/campaigns` | `ADMIN`, `MANAGER` | Creates campaign scoped to caller organization |
| `GET` | `/api/campaigns/:id` | Authenticated | Returns campaign by ID (`404` if other tenant) |
| `PATCH` | `/api/campaigns/:id` | `ADMIN`, `MANAGER` | Updates campaign with state machine transition guard |
| `DELETE` | `/api/campaigns/:id` | `ADMIN`, `MANAGER` | Deletes campaign (`404` if other tenant) |
| `GET` | `/api/campaigns/:id/users` | Authenticated | Lists users assigned to campaign |
| `POST` | `/api/campaigns/:id/users/:userId`| `ADMIN`, `MANAGER` | Enrolls user to campaign (cross-tenant blocked) |
| `DELETE`| `/api/campaigns/:id/users/:userId`| `ADMIN`, `MANAGER` | Removes user from campaign |
| `GET` | `/api/security-events` | Authenticated | Paginated, filtered security incident telemetry |
| `GET` | `/api/security-events/:id` | Authenticated | Returns event by ID (`404` if other tenant) |
| `POST` | `/api/security-events` | `ADMIN`, `MANAGER` | Reports a new security event with audit log |
| `PATCH` | `/api/security-events/:id` | `ADMIN`, `MANAGER` | Updates status or severity of security event |
| `GET` | `/api/users` | `ADMIN` | Lists organization users (passwords omitted) |
| `POST` | `/api/users` | `ADMIN` | Provisions a new user in the organization |
| `PATCH` | `/api/users/:id` | `ADMIN` | Updates role or name of a user |
| `DELETE` | `/api/users/:id` | `ADMIN` | Deletes a user (self-deletion blocked) |
| `GET` | `/api/audit-logs` | `ADMIN`, `MANAGER` | Paginated immutable audit trail (`403` for USER) |

*Full OpenAPI specification available at `http://localhost:5000/api-docs`.*

---

## 13. License

ISC © Deep Trace Cybernetics Assessment Submission.
