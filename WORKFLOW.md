# DDinfoways — Claude Code Build Workflow
# WORKFLOW.md

This file contains the exact prompts and steps to use with Claude Code
for each phase of the build. Follow phases in order. Do not skip ahead.

---

## How to Use Claude Code

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Navigate to your project root
cd ddinfoways-staff

# Start Claude Code
claude

# Give Claude Code context on first run
> Read CLAUDE.md and understand the full project before we start building.
```

---

## PHASE 1 — Database + Backend API + Auth
**Goal:** Working Express server with MySQL, full schema, and JWT login

### Step 1.1 — Backend Setup
```
Prompt:
Set up a Node.js + Express backend in the /backend folder.
- Install: express, mysql2, bcrypt, jsonwebtoken, dotenv,
  cors, express-validator, helmet, morgan
- Create server.js with middleware setup (cors, helmet, morgan, json)
- Create db/connection.js with a MySQL connection pool using mysql2
- Load config from .env
- Add a /api/health route that returns { success: true, message: "API running" }
Follow the project structure in CLAUDE.md.
```

### Step 1.2 — Database Schema
```
Prompt:
Create the full MySQL schema in /backend/db/schema.sql
Include these tables with proper foreign keys and indexes:
- users (id, name, email, password, role ENUM admin/team_lead/staff,
  status ENUM active/inactive, created_at, updated_at)
- staff_profiles (id, user_id FK, phone, address, department,
  joining_date, emergency_contact, avatar_url, created_at)
- attendance (id, user_id FK, date, check_in, check_out,
  total_hours, notes, created_at)
- leaves (id, user_id FK, type ENUM annual/sick/personal/unpaid,
  from_date, to_date, reason, status ENUM pending/approved/rejected,
  reviewed_by FK, reviewed_at, created_at)
- performance (id, user_id FK, note, rating 1-5, added_by FK, date, created_at)
- salary (id, user_id FK, month, year, amount, status ENUM paid/unpaid/partial,
  paid_on, notes, created_at)
- projects (id, name, type ENUM website/pos_onboarding/support/other,
  status ENUM active/completed/on_hold, start_date, end_date,
  description, created_by FK, created_at)
- tasks (id, title, description, priority ENUM low/medium/high/urgent,
  status ENUM todo/in_progress/review/done, assigned_to FK,
  project_id FK nullable, deadline, created_by FK,
  is_deleted BOOLEAN DEFAULT 0, created_at, updated_at)
Use snake_case for all names. Add is_deleted to users too.
```

### Step 1.3 — Auth Routes
```
Prompt:
Build JWT authentication in /backend/src/routes/auth.js
- POST /api/auth/login
  Validate email + password, compare bcrypt hash,
  return access token (15m) + refresh token (7d) + user data
- POST /api/auth/refresh
  Accept refresh token, return new access token
- POST /api/auth/logout
  Invalidate refresh token
- GET /api/auth/me
  Return current user from token

Create /backend/src/middleware/auth.js
- verifyToken middleware — validates JWT, attaches user to req
- requireRole(...roles) middleware — checks user role
  Usage: requireRole('admin') or requireRole('admin', 'team_lead')

Follow the standard API response format from CLAUDE.md.
```

### Step 1.4 — Staff Routes
```
Prompt:
Build staff CRUD in /backend/src/routes/staff.js
All routes protected by verifyToken.

- GET    /api/staff          (admin, team_lead only) — list all staff with profiles
- GET    /api/staff/:id      (admin or own profile) — get single staff with profile
- POST   /api/staff          (admin only) — create staff + profile + hash password
- PUT    /api/staff/:id      (admin only) — update staff + profile
- DELETE /api/staff/:id      (admin only) — soft delete (set is_deleted = 1)

Use controllers in /backend/src/controllers/staffController.js
```

### Step 1.5 — Remaining Routes
```
Prompt:
Build the remaining API routes following the same pattern:

Attendance (/api/attendance):
- POST /checkin — log check-in for current user
- POST /checkout — log check-out for current user
- GET /:userId — get attendance history (admin sees all, staff sees own)
- GET /today — get today's attendance for current user

Leaves (/api/leaves):
- POST / — staff applies for leave
- GET / — admin sees all, staff sees own
- PUT /:id/approve — admin approves
- PUT /:id/reject — admin rejects

Performance (/api/performance):
- POST / — admin adds note/rating for a staff member
- GET /:userId — get performance history

Salary (/api/salary):
- POST / — admin adds salary record
- GET /:userId — get salary history
- PUT /:id — update payment status

Tasks (/api/tasks):
- GET / — admin sees all, staff sees assigned
- POST / — admin/team_lead creates task
- PUT /:id — update task details
- PUT /:id/status — update task status only
- DELETE /:id — soft delete

Projects (/api/projects):
- GET / — all projects
- POST / — admin creates project
- PUT /:id — update project
- GET /:id/tasks — get all tasks for a project
```

---

## PHASE 2 — Next.js Frontend + Login + Dashboard
**Goal:** Working frontend with auth and admin dashboard

### Step 2.1 — Next.js Setup
```
Prompt:
Set up Next.js 14 in the /frontend folder.
- Use App Router
- Install and configure Tailwind CSS
- Install and init Shadcn/ui (use slate as base color)
- Install: axios, react-hook-form, zod, @hookform/resolvers,
  lucide-react, recharts, date-fns, js-cookie
- Set up /lib/api.js — axios instance pointing to NEXT_PUBLIC_API_URL
  with request interceptor (attach Bearer token)
  and response interceptor (handle 401 — redirect to login)
- Set up /lib/auth.js — helpers: getToken(), setToken(), removeToken()
- Create a (auth) route group for login page
- Create a (dashboard) route group with layout.jsx that has
  the sidebar and header (protected — redirect to login if no token)
```

### Step 2.2 — Login Page
```
Prompt:
Build the login page at /app/(auth)/login/page.jsx

Design requirements:
- Full screen, centered card layout
- DDinfoways logo placeholder at top (text for now)
- Email and password fields using Shadcn Input
- Login button with loading spinner state
- Error message display for wrong credentials
- Form validation with react-hook-form + zod
  (email must be valid, password min 6 chars)
- On success: store token, redirect to /dashboard based on role
- Professional, MNC-grade design — dark navy background,
  white card, DDinfoways brand colors (#1A3A5C, #2E75B6)
- No registration link (admin creates accounts)
```

### Step 2.3 — Layout (Sidebar + Header)
```
Prompt:
Build the dashboard layout in /app/(dashboard)/layout.jsx

Sidebar requirements:
- Fixed left sidebar, 240px wide
- DDinfoways logo at top
- Navigation links with icons (lucide-react):
  Dashboard, Staff, Tasks, Projects, Attendance, Leaves,
  Performance, Salary, Settings
- Active link highlighted
- Role-based nav — staff only sees their own relevant links
- Collapse to icon-only on mobile
- User avatar + name + role at bottom with logout button

Header requirements:
- Top bar with page title (breadcrumb)
- Notification bell icon
- User avatar with dropdown (profile, logout)
- Clean white background with subtle border

Make it look like a premium SaaS dashboard (Notion/Linear level).
```

### Step 2.4 — Admin Dashboard
```
Prompt:
Build the admin dashboard at /app/(dashboard)/dashboard/page.jsx

Stat cards row (fetch from /api/staff, /api/tasks, /api/attendance):
- Total Staff (with active count)
- Tasks Today (pending vs done)
- Present Today (attendance count)
- Pending Leaves (approval count)

Charts section (use Recharts):
- Bar chart: Tasks by status this week
- Line chart: Attendance trend last 30 days

Tables section:
- Recent Tasks (last 5, with assignee, status badge, priority badge)
- Pending Leave Requests (with approve/reject buttons)

All data must show skeleton loaders while fetching.
Use the DDinfoways brand color scheme.
Make it look like a Salesforce / HubSpot dashboard.
```

---

## PHASE 3 — Staff + Attendance
**Goal:** Full staff management and attendance tracking

### Step 3.1 — Staff List Page
```
Prompt:
Build /app/(dashboard)/staff/page.jsx

- Data table with columns: Avatar, Name, Role badge,
  Department, Phone, Joining Date, Status badge, Actions
- Search by name or email
- Filter by role and department
- Sort by name, joining date
- Add Staff button (opens modal/drawer form)
- Row actions: View Profile, Edit, Deactivate
- Use Shadcn Table component
- Empty state with illustration placeholder
- Skeleton loader while fetching
```

### Step 3.2 — Staff Profile Page
```
Prompt:
Build /app/(dashboard)/staff/[id]/page.jsx

Tabbed layout with these tabs:
1. Overview — avatar, name, role, contact, joining date, department
2. Attendance — calendar heatmap of check-ins + monthly summary table
3. Leave — leave history with status badges + stats (used/remaining)
4. Performance — timeline of notes and ratings
5. Salary — payment history table with status badges

Admin can edit profile from Overview tab.
Back button to staff list.
```

### Step 3.3 — Attendance Module
```
Prompt:
Build /app/(dashboard)/attendance/page.jsx

For Staff view:
- Big Check In / Check Out button with current time
- Today's status card (checked in at X, checked out at Y, total hours)
- Calendar heatmap of last 30 days (green = present, red = absent)
- Monthly attendance table

For Admin view:
- Today's attendance overview — who is in, who is not
- Staff list with present/absent status badges
- Date picker to view any day's attendance
- Export to CSV button
```

---

## PHASE 4 — Leave, Performance, Salary
**Goal:** Full HR management modules

### Step 4.1 — Leave Module
```
Prompt:
Build /app/(dashboard)/leaves/page.jsx

For Staff:
- Apply for Leave form (type, from, to, reason)
- My leave history table with status badges
- Leave balance summary (annual: X/Y used)

For Admin:
- Pending approvals table with Approve/Reject buttons
- All leaves table with filters (status, type, staff, date range)
- Stats: total leaves this month by type
```

### Step 4.2 — Performance Module
```
Prompt:
Build /app/(dashboard)/performance/page.jsx

For Admin:
- Select staff member dropdown
- Add performance note form (note textarea, rating 1-5 stars)
- Performance history timeline per staff

For Staff:
- Own performance timeline (read only)
- Average rating display
```

### Step 4.3 — Salary Module
```
Prompt:
Build /app/(dashboard)/salary/page.jsx

For Admin:
- Add salary record form (staff, month, year, amount, status)
- All salary records table with filters
- Mark as paid button per record
- Monthly payroll summary

For Staff:
- Own salary history (read only)
- Total paid YTD
```

---

## PHASE 5 — Tasks + Projects (Kanban)
**Goal:** Full work management with Kanban board

### Step 5.1 — Tasks Kanban Board
```
Prompt:
Build /app/(dashboard)/tasks/page.jsx

Two views (toggle button):
1. Kanban Board view:
   - 4 columns: To Do, In Progress, Review, Done
   - Drag and drop cards between columns (use @hello-pangea/dnd)
   - Task card: title, assignee avatar, priority badge,
     deadline, project tag
   - Add task button per column
   - Column task count badge

2. List view:
   - Sortable table with all columns
   - Filters: status, priority, assignee, project, deadline

Create Task Modal (shared):
- Title, description, priority dropdown, deadline date picker,
  assign to dropdown (staff list), link to project (optional)
- Form validation with zod
```

### Step 5.2 — Projects Board
```
Prompt:
Build /app/(dashboard)/projects/page.jsx

- Card grid layout — one card per project
- Card shows: project name, type badge, status badge,
  task progress bar (X/Y tasks done), start/end dates, created by
- Filter by type and status
- Create Project modal
- Click card → project detail page

Build /app/(dashboard)/projects/[id]/page.jsx:
- Project header with name, type, status, dates
- Kanban board filtered to this project's tasks only
- Team members assigned to tasks in this project
- Edit project button (admin only)
```

---

## PHASE 6 — Polish + PWA
**Goal:** Production-ready, mobile-installable

### Step 6.1 — PWA Setup
```
Prompt:
Add PWA support to the Next.js frontend.
- Install next-pwa
- Configure in next.config.js
- Create /public/manifest.json with DDinfoways app name,
  icons, theme color (#1A3A5C), background color (#ffffff)
- Add meta tags to layout for mobile viewport and theme color
- Test that "Add to Home Screen" works on Android Chrome
```

### Step 6.2 — Final Polish
```
Prompt:
Do a final polish pass across the entire app:
- Ensure all pages have proper loading skeletons
- Ensure all forms show validation errors inline
- Ensure all destructive actions have confirmation modals
- Add empty states to all tables and lists
- Check all pages are responsive on mobile (375px width)
- Add page transitions
- Verify all toast notifications are working
- Check dark mode works on all pages
```

---

## Useful Claude Code Commands

```bash
# Show all files in current directory
> list all files in the project

# Fix a specific bug
> The login form is not showing the error message when credentials are wrong. Fix it.

# Add a feature
> Add a search bar to the staff list page that filters by name in real time

# Review code
> Review the auth middleware and check for security issues

# Generate seed data
> Create seed.sql with 5 sample staff members, some tasks and projects for testing

# Debug
> The check-in button is calling the wrong API endpoint. Here is the error: [paste error]
```

---

## Checklist Before Each Phase

- [ ] Previous phase is fully working and tested
- [ ] CLAUDE.md phase status is updated
- [ ] No console errors in browser
- [ ] API returns correct response format
- [ ] Loading and error states are handled
- [ ] Mobile view looks acceptable
- [ ] Git commit made with proper message
