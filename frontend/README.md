# Deep Trace Cybernetics — Security Platform Frontend

Modern, responsive cybersecurity management interface built with **React**, **Vite**, **React Router**, and **Axios**.

## Architecture & Features

- **Cybersecurity SaaS Theme**: Clean white/light gray background, dark navy sidebar, and high-visibility severity badges (CRITICAL, HIGH, MEDIUM, LOW).
- **Zero-Trust Multi-Tenant Session**: Displays current active tenant and organization context in the topbar and sidebar.
- **Client-Side RBAC Visibility**: Automatically adjusts navigation and administrative controls based on the verified role (`ADMIN`, `MANAGER`, `USER`), backed by strict server-side API rejection.
- **Interactive Multi-Tenant Security Lab**: Live in-browser demonstration tool to test foreign tenant campaign IDs and observe immediate `404 Not Found` IDOR protection.
- **Server-Side Pagination & Filtering**: Real-time server-side pagination, search, status filtering, and sorting for all data tables.
- **State Transition Guard**: Visual feedback on campaign status transitions (e.g. `COMPLETED` terminal state).

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your running backend:

```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Start Development Server

```bash
npm run dev
```

Visit the dashboard at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```
