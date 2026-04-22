# DDinfoways Staff & Work Management System
# AGENTS.md — Project Context & Rules

## Project Overview
Internal staff and work management platform for DDinfoways Limited,
a New Zealand-based hospitality and retail technology company.
Serves 4–5 staff. Must look and feel MNC-grade.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router)             |
| UI Kit      | Shadcn/ui + Tailwind CSS            |
| Backend     | Node.js + Express.js (REST API)     |
| Database    | MySQL                               |
| Auth        | JWT (access + refresh tokens)       |
| Hosting     | Cloudflare Pages (FE) + VPS (BE)    |
| Mobile      | Capacitor (Phase 2)                 |
| Email       | Nodemailer (notifications)          |

---

## Project Structure

```
ddinfoways-staff/
├── AGENTS.md
├── .cursorrules
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── staff/
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── performance/
│   │   │   └── salary/
│   ├── components/
│   │   ├── ui/           (shadcn auto-generated)
│   │   ├── layout/       (sidebar, header, breadcrumb)
│   │   ├── dashboard/    (stat cards, charts)
│   │   ├── staff/        (staff table, profile, forms)
│   │   ├── tasks/        (kanban, task card, filters)
│   │   └── shared/       (modals, loaders, badges)
│   ├── lib/
│   │   ├── api.js        (axios instance + interceptors)
│   │   ├── auth.js       (token helpers)
│   │   └── utils.js      (formatters, helpers)
│   └── hooks/
│       ├── useAuth.js
│       └── useTasks.js
│
└── backend/
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── models/
    │   ├── middleware/
    │   ├── services/
    │   └── utils/
    ├── db/
    │   ├── schema.sql
    │   └── seed.sql
    └── server.js
```

---

## User Roles & Permissions

| Role      | Access                                              |
|-----------|-----------------------------------------------------|
| Admin     | Full access — all modules, all staff                |
| Team Lead | Tasks, projects, view team attendance/leaves        |
| Staff     | Own profile, own tasks, own attendance, own leaves  |

---

## Modules

1. **Auth** — Login, logout, JWT refresh, role-based routing
2. **Staff Profiles** — Name, role, contact, joining date, department
3. **Attendance** — Check-in/out, daily summary, calendar heatmap
4. **Leave Management** — Apply, approve/reject, leave types, history
5. **Performance** — Notes, ratings, added by admin, date-stamped
6. **Salary** — Monthly records, payment status, history per staff
7. **Tasks** — Create, assign, priority, deadline, Kanban board
8. **Projects** — Types: Website Build, POS Onboarding, Support, Other
9. **ID Card Generator** — Auto-generates staff ID cards
   with photo, QR code, staff details.
   Format: PNG + PDF download.
   Staff ID format: DD-YYYY-NNN (auto on staff creation)
   Libraries: html-to-image, jspdf, qrcode.react
---

## Code Conventions

### General
- Always use async/await — never raw .then() chains
- Always handle errors with try/catch
- Never hardcode secrets — use .env variables
- All API responses must follow the standard response format (see below)
- Use named exports for utilities, default exports for components/pages

### Naming
- Files: kebab-case (e.g. staff-profile.jsx)
- Components: PascalCase (e.g. StaffProfile)
- Functions/variables: camelCase
- Database tables/columns: snake_case
- Constants: UPPER_SNAKE_CASE
- API routes: /api/resource or /api/resource/:id (RESTful)

### API Response Format (always follow this)
```json
{
  "success": true,
  "message": "Staff fetched successfully",
  "data": { },
  "meta": { "page": 1, "total": 50 }
}
```

Error format:
```json
{
  "success": false,
  "message": "Unauthorised access",
  "error": "TOKEN_EXPIRED"
}
```

### Frontend
- All API calls go through /lib/api.js (axios instance)
- Never call fetch() directly in components
- Use Shadcn components — never build UI primitives from scratch
- All forms must use react-hook-form + zod validation
- All tables must be sortable and have search/filter
- Loading states: always show skeleton loaders (never blank screens)
- Errors: always show toast notifications (never alert())
- Confirm destructive actions with a modal dialog — never delete directly

### Backend
- All routes must go through auth middleware
- Validate all request bodies with express-validator or zod
- Never return raw MySQL errors to the client
- Passwords must be hashed with bcrypt (salt rounds: 12)
- Log all errors to console with context (route + error message)

---

## Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ddinfoways_staff
DB_USER=
DB_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Git Conventions

### Branch Naming
```
main          — production only
develop       — active development
feature/xxx   — new features (e.g. feature/attendance-module)
fix/xxx       — bug fixes (e.g. fix/login-token-refresh)
hotfix/xxx    — urgent production fixes
```

### Commit Message Format
```
feat: add attendance check-in endpoint
fix: correct JWT expiry logic
style: update sidebar active state color
refactor: extract task status badge to component
docs: update AGENTS.md with salary module
```

---

## Build Phases

| Phase | Scope                                      | Status  |
|-------|--------------------------------------------|---------|
| 1     | DB schema + Express API + JWT Auth         | Completed |
| 2     | Next.js setup + Login + Admin Dashboard    | Completed |
| 3     | Staff profiles + Attendance module         | Completed |
| 4     | Leave + Performance + Salary               | Completed |
| 5     | Tasks + Project boards (Kanban)            | Completed |
| 6     | Polish + PWA + Mobile (Capacitor)          | Completed |

---

## Design System

- Primary color: #1A3A5C (DDinfoways navy)
- Accent: #2E75B6 (DDinfoways blue)
- Font: Inter (via next/font)
- Border radius: rounded-lg (8px) for cards, rounded-md for inputs
- Shadows: shadow-sm for cards, shadow-md for modals
- Dark mode: supported via Tailwind dark: classes

---

## Notes
- This is an internal tool — not public-facing
- NZ timezone: Pacific/Auckland (use in all date/time displays)
- All salary amounts in NZD
- Keep bundle size lean — avoid heavy libraries unless necessary
