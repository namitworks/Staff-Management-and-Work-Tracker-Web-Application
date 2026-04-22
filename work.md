Read CLAUDE.md, RULES.md and the full existing codebase 
completely before starting. Understand every existing file,
every existing route, every existing component. Do not 
duplicate anything that already exists.

We need to build ALL remaining modules for the DDinfoways
Staff Management System. Build them one by one in order,
completing and testing each before moving to the next.

The app is using dummy data during development.
Do not worry about existing data — just make everything work.

═══════════════════════════════════════════════════════════
MODULE 1 — ATTENDANCE SYSTEM
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 1.1 — DATABASE
─────────────────────────────────────────────

Create backend/db/migration_attendance.sql

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS:
  status     ENUM('present','absent','half_day','late') DEFAULT 'present',
  location   VARCHAR(255),
  ip_address VARCHAR(45),
  notes      TEXT

─────────────────────────────────────────────
STEP 1.2 — BACKEND API
─────────────────────────────────────────────

Create backend/src/controllers/attendanceController.js

Functions:

1. checkIn(req, res)
   POST /api/attendance/checkin
   - Only one check-in per day per user allowed
   - Record: user_id, date (today), check_in (now),
     status = 'present', ip_address from req.ip
   - If check-in after 9:30am NZ time → status = 'late'
   - Return: attendance record

2. checkOut(req, res)
   POST /api/attendance/checkout
   - Find today's attendance record for user
   - Set check_out = now
   - Calculate total_hours = diff between check_in and check_out
   - If total_hours < 4 → status = 'half_day'
   - Return: updated attendance record

3. getTodayAttendance(req, res)
   GET /api/attendance/today
   - Admin: return all staff with present/absent status today
   - Staff: return own today's record

4. getAttendanceByUser(req, res)
   GET /api/attendance/user/:userId
   - Accept query params: month, year
   - Return all attendance records for that month
   - Include days with no record as 'absent'
   - Admin or own only

5. getAttendanceSummary(req, res)
   GET /api/attendance/summary/:userId
   - Return: total present, absent, late, half_day
     for current month
   - Also return: working days this month, attendance %

6. getMonthlyReport(req, res)
   GET /api/attendance/report
   - Admin only
   - Query params: month, year
   - Return all staff attendance summary for that month

Create backend/src/routes/attendance.js
Register in server.js

─────────────────────────────────────────────
STEP 1.3 — FRONTEND
─────────────────────────────────────────────

Create frontend/app/(dashboard)/attendance/page.jsx

─── STAFF VIEW ───
Top card — Check In / Check Out:
  - Large clock showing current time (updates every second)
  - Current date in full format (Wednesday, 22 April 2026)
  - NZ timezone (Pacific/Auckland)
  - BIG green "CHECK IN" button if not checked in today
  - BIG red "CHECK OUT" button if checked in but not out
  - If both done: show "Completed for today" with green tick
  - Show today's summary: Checked in at X | Checked out at X
    | Total hours: X hrs X mins
  - Button shows loading spinner while API call is in progress

Status cards row:
  This Month Present | This Month Absent |
  Late Arrivals | Attendance %

Calendar heatmap (current month):
  - Grid of days in month
  - Green = present, Red = absent, Amber = late,
    Yellow = half day, Gray = weekend/holiday,
    Blue = today
  - Click a day → show that day's check-in/out times in tooltip

Monthly table below calendar:
  Date | Day | Check In | Check Out | Hours | Status badge
  Show all days of current month
  Month/Year selector to view past months

─── ADMIN VIEW ───
Today's Overview section:
  - Present today: X/X staff with green progress bar
  - List of staff with avatar, name, check-in time,
    status badge (Present/Absent/Late)
  - Staff not yet checked in shown with gray "Absent" badge

Monthly Report section:
  - Month/Year selector
  - Table: Staff Name | Present | Absent | Late |
    Half Day | Attendance %
  - Export to CSV button
  - Color code: green if % > 90, amber if 70-90, red if < 70

─────────────────────────────────────────────
STEP 1.4 — DUMMY DATA
─────────────────────────────────────────────

Add to backend/db/seed_dummy.sql:
- Attendance records for all 4 dummy staff
- Last 30 days of attendance
- Mix of: present, absent (weekends), late (few),
  half_day (1-2 per staff)
- Realistic check-in times: 8:30am - 9:45am NZ time
- Realistic check-out times: 5:00pm - 6:30pm NZ time


═══════════════════════════════════════════════════════════
MODULE 2 — LEAVE MANAGEMENT
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 2.1 — DATABASE
─────────────────────────────────────────────

Create backend/db/migration_leaves.sql

ALTER TABLE leaves ADD COLUMN IF NOT EXISTS:
  total_days     INT DEFAULT 1,
  leave_year     INT,
  admin_note     TEXT,
  is_deleted     BOOLEAN DEFAULT 0

Create leave_balances table IF NOT EXISTS:
  CREATE TABLE IF NOT EXISTS leave_balances (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    year            INT NOT NULL,
    annual_total    INT DEFAULT 20,
    annual_used     INT DEFAULT 0,
    sick_total      INT DEFAULT 10,
    sick_used       INT DEFAULT 0,
    personal_total  INT DEFAULT 5,
    personal_used   INT DEFAULT 0,
    created_at      DATETIME DEFAULT NOW(),
    updated_at      DATETIME DEFAULT NOW(),
    UNIQUE KEY unique_user_year (user_id, year),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

─────────────────────────────────────────────
STEP 2.2 — BACKEND API
─────────────────────────────────────────────

Create backend/src/controllers/leaveController.js

Functions:

1. applyLeave(req, res)
   POST /api/leaves
   Body: { type, from_date, to_date, reason }
   - Calculate total_days (exclude weekends)
   - Check leave balance — reject if insufficient
   - Create leave record with status = 'pending'
   - Return leave record

2. getLeaves(req, res)
   GET /api/leaves
   - Admin: all leaves with staff name, paginated
   - Staff: own leaves only
   - Filter by: status, type, year

3. getLeaveById(req, res)
   GET /api/leaves/:id

4. approveLeave(req, res)
   PUT /api/leaves/:id/approve
   Admin only.
   - Set status = 'approved', reviewed_by, reviewed_at
   - Deduct from leave_balances
   - Body: { admin_note (optional) }

5. rejectLeave(req, res)
   PUT /api/leaves/:id/reject
   Admin only.
   - Set status = 'rejected', reviewed_by, reviewed_at
   - Do NOT deduct from leave_balances
   - Body: { admin_note }

6. getLeaveBalance(req, res)
   GET /api/leaves/balance/:userId
   - Return leave_balances for current year
   - Admin or own only

7. cancelLeave(req, res)
   PUT /api/leaves/:id/cancel
   - Staff can cancel own pending leaves only
   - Set status = 'cancelled'

Create backend/src/routes/leaves.js
Register in server.js

─────────────────────────────────────────────
STEP 2.3 — FRONTEND
─────────────────────────────────────────────

Create frontend/app/(dashboard)/leaves/page.jsx

─── STAFF VIEW ───
Leave Balance cards row (3 cards):
  Annual Leave:  X / 20 days used  (progress bar)
  Sick Leave:    X / 10 days used  (progress bar)
  Personal Leave: X / 5 days used  (progress bar)
  Color: green if < 50% used, amber if 50-80%, red if > 80%

Apply for Leave button → opens ApplyLeaveModal

My Leave History table:
  Type badge | From | To | Days | Reason | Status badge |
  Actions (Cancel if pending)
  Status colors:
    pending  → amber
    approved → green
    rejected → red
    cancelled → gray

─── ADMIN VIEW ───
Summary cards:
  Pending Approvals | Approved This Month |
  Rejected This Month | Staff On Leave Today

Pending Approvals section (highlighted at top):
  Card per pending leave:
    Staff avatar + name | Leave type | From → To | X days
    Reason text
    Admin note input field
    Green "Approve" button | Red "Reject" button

All Leaves table below:
  Staff | Type | From | To | Days | Applied On |
  Status | Reviewed By | Actions

Filter bar: Status, Type, Month/Year, Staff name search

Create frontend/components/leaves/ApplyLeaveModal.jsx
  Form fields:
    Leave Type (Annual/Sick/Personal/Unpaid)
    From Date (date picker)
    To Date (date picker)
    Reason (textarea)
  Live calculation: shows "X working days" as dates are selected
  Shows remaining balance for selected leave type
  Validation: cannot apply if insufficient balance
  Submit → POST /api/leaves → close modal → refresh table


═══════════════════════════════════════════════════════════
MODULE 3 — PERFORMANCE MANAGEMENT
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 3.1 — DATABASE
─────────────────────────────────────────────

Create backend/db/migration_performance.sql

ALTER TABLE performance ADD COLUMN IF NOT EXISTS:
  category  ENUM('technical','communication','teamwork',
                 'punctuality','leadership','general')
            DEFAULT 'general',
  is_deleted BOOLEAN DEFAULT 0

─────────────────────────────────────────────
STEP 3.2 — BACKEND API
─────────────────────────────────────────────

Create backend/src/controllers/performanceController.js

Functions:

1. addNote(req, res)
   POST /api/performance
   Admin only.
   Body: { user_id, note, rating (1-5), category, date }
   Return: created performance record

2. getPerformanceByUser(req, res)
   GET /api/performance/:userId
   Admin or own.
   Return all notes newest first with added_by name

3. getPerformanceSummary(req, res)
   GET /api/performance/summary/:userId
   Return:
   - Average rating overall
   - Average rating per category
   - Total notes count
   - Rating trend (last 6 months)

4. updateNote(req, res)
   PUT /api/performance/:id
   Admin only. Update note or rating.

5. deleteNote(req, res)
   DELETE /api/performance/:id
   Admin only. Soft delete.

Create backend/src/routes/performance.js
Register in server.js

─────────────────────────────────────────────
STEP 3.3 — FRONTEND
─────────────────────────────────────────────

Create frontend/app/(dashboard)/performance/page.jsx

─── ADMIN VIEW ───
Staff selector dropdown at top (select any staff member)

Once staff selected, show:

Summary cards row:
  Overall Rating (X.X / 5.0 with star display) |
  Total Reviews | Best Category | Latest Review Date

Rating by Category (horizontal bar chart using Recharts):
  Technical, Communication, Teamwork,
  Punctuality, Leadership, General
  Each bar shows average rating 0-5

Rating Trend (line chart using Recharts):
  Last 6 months average rating line chart

Add Performance Note button → opens AddNoteModal

Performance Timeline (newest first):
  Each note as a card:
    Category badge | Rating stars (filled/empty) |
    Date | Added by
    Note text
    Edit | Delete buttons (admin only)

─── STAFF VIEW ───
Same page but read-only, no Add button, no Edit/Delete
Shows own performance only

Create frontend/components/performance/AddNoteModal.jsx
  Fields: Staff (dropdown), Category, Rating (1-5 star 
  picker), Date, Note (textarea min 20 chars)
  Validation with zod


═══════════════════════════════════════════════════════════
MODULE 4 — TASK MANAGER (KANBAN)
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 4.1 — DATABASE
─────────────────────────────────────────────

Create backend/db/migration_tasks.sql

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS:
  tags          VARCHAR(255),
  attachments   TEXT,
  progress      INT DEFAULT 0,
  estimated_hrs DECIMAL(5,2) DEFAULT 0,
  actual_hrs    DECIMAL(5,2) DEFAULT 0,
  completed_at  DATETIME,
  position      INT DEFAULT 0

ALTER TABLE projects ADD COLUMN IF NOT EXISTS:
  progress      INT DEFAULT 0,
  client_name   VARCHAR(100),
  budget        DECIMAL(10,2) DEFAULT 0,
  is_deleted    BOOLEAN DEFAULT 0

─────────────────────────────────────────────
STEP 4.2 — BACKEND API
─────────────────────────────────────────────

Create backend/src/controllers/taskController.js

Functions:

1. getTasks(req, res)
   GET /api/tasks
   - Admin/Team Lead: all tasks
   - Staff: only assigned to them
   - Filter by: status, priority, project_id, assigned_to
   - Sort by: deadline, priority, created_at

2. getTaskById(req, res)
   GET /api/tasks/:id

3. createTask(req, res)
   POST /api/tasks
   Admin or Team Lead only.
   Body: { title, description, priority, status,
           assigned_to, project_id, deadline,
           estimated_hrs, tags }
   Return: created task with assignee details

4. updateTask(req, res)
   PUT /api/tasks/:id
   Admin/Team Lead: update any field
   Staff: can only update status and actual_hrs of own tasks

5. updateTaskStatus(req, res)
   PUT /api/tasks/:id/status
   Body: { status }
   - When status = 'done' set completed_at = now
   - Update project progress based on % of done tasks

6. deleteTask(req, res)
   DELETE /api/tasks/:id
   Admin/Team Lead only. Soft delete.

7. getProjects(req, res)
   GET /api/projects
   All roles.

8. getProjectById(req, res)
   GET /api/projects/:id
   With all tasks for this project

9. createProject(req, res)
   POST /api/projects
   Admin only.

10. updateProject(req, res)
    PUT /api/projects/:id
    Admin only.

11. deleteProject(req, res)
    DELETE /api/projects/:id
    Admin only. Soft delete.

Create backend/src/routes/tasks.js
Create backend/src/routes/projects.js
Register both in server.js

─────────────────────────────────────────────
STEP 4.3 — FRONTEND TASKS PAGE
─────────────────────────────────────────────

Create frontend/app/(dashboard)/tasks/page.jsx

View Toggle: "Kanban" | "List" buttons top right

─── KANBAN VIEW ───
Install: @hello-pangea/dnd

4 columns side by side:
  TO DO | IN PROGRESS | REVIEW | DONE
  Each column:
    Header: column name + task count badge
    Scrollable card list
    "Add Task" button at bottom of column (admin/lead only)

Task Card:
  Title (bold)
  Project tag (colored pill)
  Priority badge: Urgent=red, High=orange,
                  Medium=blue, Low=gray
  Assignee avatar (circular, 24px)
  Deadline: shows date, turns red if overdue
  Progress bar if progress > 0

Drag and drop between columns:
  On drop → call PUT /api/tasks/:id/status
  Optimistic update (move card immediately, revert if error)

─── LIST VIEW ───
Sortable table:
  Title | Project | Priority | Assigned To |
  Deadline | Status | Actions

Filter bar:
  Search by title | Filter by priority |
  Filter by assignee | Filter by project |
  Filter by status

Actions: Edit (opens modal) | Delete (confirm dialog)

Create frontend/components/tasks/CreateTaskModal.jsx
  Fields:
    Title (required)
    Description (textarea)
    Project (dropdown, optional)
    Priority (select: Low/Medium/High/Urgent)
    Assign To (staff dropdown with avatars)
    Deadline (date picker)
    Estimated Hours (number)
    Tags (comma separated text)
  react-hook-form + zod validation

─────────────────────────────────────────────
STEP 4.4 — FRONTEND PROJECTS PAGE
─────────────────────────────────────────────

Create frontend/app/(dashboard)/projects/page.jsx

Summary cards:
  Active Projects | Completed | On Hold | Total Tasks

Project cards grid (3 columns):
  Each card:
    Project type icon (Globe for website,
    Monitor for POS, Headphones for support)
    Project name (bold)
    Type badge | Status badge
    Client name (if set)
    Progress bar: X% complete (based on task completion)
    Task count: X/Y tasks done
    Start date → End date
    Assigned staff avatars (max 4, +N if more)
    "View Tasks" button

"Create Project" button top right (admin only)
→ opens CreateProjectModal

Create frontend/app/(dashboard)/projects/[id]/page.jsx
  Project header: name, type, status, dates, progress
  Kanban board filtered to this project's tasks
  Back to Projects button

Create frontend/components/projects/CreateProjectModal.jsx
  Fields: Name, Type, Status, Client Name,
  Start Date, End Date, Budget, Description


═══════════════════════════════════════════════════════════
MODULE 5 — STAFF PROFILE (COMPLETE)
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 5.1 — AVATAR UPLOAD
─────────────────────────────────────────────

Add avatar upload to staff profile.

Backend:
  Install: multer
  Create backend/src/middleware/upload.js
    Configure multer: store in backend/uploads/avatars/
    File types: jpg, jpeg, png, webp only
    Max size: 2MB
    Filename: [userId]-[timestamp].[ext]
  
  Add route: POST /api/staff/:id/avatar
    Middleware: verifyToken, requireRole('admin'), upload.single('avatar')
    Update staff_profiles.avatar_url with file path
    Return: new avatar_url

  Serve static files in server.js:
    app.use('/uploads', express.static('uploads'))

Frontend:
  In staff profile Overview tab:
    Avatar circle is clickable for admin
    Click → opens file picker
    Shows preview before upload
    "Upload" button confirms
    "Cancel" button removes preview
    Show upload progress
    On success: update avatar display with new image
    Crop hint: "Best size: 200×200px, max 2MB"

─────────────────────────────────────────────
STEP 5.2 — FULL PROFILE EDIT
─────────────────────────────────────────────

Update frontend/app/(dashboard)/staff/[id]/page.jsx

Overview tab must have full edit capability:

Personal Info section (editable):
  Full Name, Email, Phone, Address,
  Emergency Contact Name, Emergency Contact Phone,
  Blood Group, Date of Birth

Work Info section (editable by admin only):
  Department, Role/Designation, Joining Date,
  Employment Type (Full Time/Part Time/Contract),
  Reporting To (dropdown of team leads/admins)

Tax & Banking section (editable by admin only):
  IRD Number, Tax Code, KiwiSaver Rate,
  Bank Name, Bank Account Number

"Edit Profile" button → puts form in edit mode
"Save Changes" button → PUT /api/staff/:id
"Cancel" button → reverts changes
Show success toast on save

─────────────────────────────────────────────
STEP 5.3 — PROFILE TABS
─────────────────────────────────────────────

Ensure staff profile has ALL these tabs working:
  Overview | Attendance | Leave | Performance |
  Salary | ID Card | Activity Log

Activity Log tab (new):
  Timeline of recent actions for this staff:
  - Last login time
  - Last check-in/out
  - Recent task updates
  - Recent leave applications
  Show last 20 activities with icons and timestamps


═══════════════════════════════════════════════════════════
MODULE 6 — DASHBOARD (REAL DATA + CHARTS)
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 6.1 — BACKEND STATS API
─────────────────────────────────────────────

Update backend/src/controllers/dashboardController.js

getStats must return ALL of:
{
  staff: {
    total, active, inactive, new_this_month
  },
  attendance: {
    present_today, absent_today, late_today,
    attendance_rate_this_month
  },
  tasks: {
    total, todo, in_progress, review, done,
    overdue, completed_this_week
  },
  projects: {
    total, active, completed, on_hold
  },
  leaves: {
    pending_approvals, approved_this_month,
    on_leave_today
  },
  recent_tasks: [ last 5 tasks with assignee ],
  pending_leaves: [ pending leaves with staff name ],
  todays_attendance: [ all staff with status today ],
  task_trend: [ last 7 days task completion count ],
  attendance_trend: [ last 30 days present count ]
}

─────────────────────────────────────────────
STEP 6.2 — FRONTEND DASHBOARD
─────────────────────────────────────────────

Update frontend/app/(dashboard)/dashboard/page.jsx

─── ADMIN DASHBOARD ───

Row 1 — Stat Cards (6 cards):
  Total Staff | Present Today | Pending Leaves |
  Active Tasks | Active Projects | Tasks Overdue
  Each card: icon, number, label, trend arrow
  with % change vs last month

Row 2 — Charts (2 charts side by side):
  Left: Bar chart — Tasks by status this week
        (Recharts BarChart, colors per status)
  Right: Line chart — Attendance last 30 days
        (Recharts LineChart, navy color)

Row 3 — Two columns:
  Left: Recent Tasks list (last 5)
        Title | Assignee avatar | Priority badge |
        Status badge | Deadline
        "View All Tasks" link at bottom

  Right: Pending Leave Approvals (all pending)
         Staff avatar + name | Leave type |
         From → To | Days
         Approve / Reject buttons inline
         "View All Leaves" link at bottom

Row 4 — Today's Attendance:
  Title: "Who's In Today — [date]"
  Staff grid: avatar + name + check-in time
  Present = green ring, Absent = gray, Late = amber ring
  Shows all staff

─── STAFF DASHBOARD ───
My Today card:
  Check in/out quick button (same as attendance page)
  Today's status

My Tasks (assigned to me):
  Kanban mini view or list of my open tasks
  Priority badges, deadlines

My Leave Balance:
  3 mini cards: Annual / Sick / Personal remaining

My Attendance this month:
  Mini calendar heatmap (current month only)

Recent Performance Notes:
  Last 2 performance notes from admin (read only)


═══════════════════════════════════════════════════════════
MODULE 7 — NOTIFICATIONS
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 7.1 — DATABASE
─────────────────────────────────────────────

Create table in backend/db/migration_notifications.sql:

  CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        ENUM('info','success','warning','error')
                DEFAULT 'info',
    category    ENUM('task','leave','attendance',
                     'performance','payslip','system')
                DEFAULT 'system',
    is_read     BOOLEAN DEFAULT 0,
    link        VARCHAR(500),
    created_at  DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

─────────────────────────────────────────────
STEP 7.2 — BACKEND
─────────────────────────────────────────────

Create backend/src/utils/notificationHelper.js
  Function: createNotification(userId, title, message,
            type, category, link)
  Inserts into notifications table

Trigger notifications automatically:
  - Leave applied → notify all admins
  - Leave approved/rejected → notify the staff member
  - Task assigned → notify the assignee
  - Task overdue → notify assignee and admin
  - Performance note added → notify the staff member
  - Payslip generated → notify the staff member

Create backend/src/controllers/notificationController.js

Functions:
  getNotifications(req, res)
    GET /api/notifications
    Return own notifications, newest first
    Include unread count

  markAsRead(req, res)
    PUT /api/notifications/:id/read

  markAllAsRead(req, res)
    PUT /api/notifications/read-all

  deleteNotification(req, res)
    DELETE /api/notifications/:id

Create backend/src/routes/notifications.js
Register in server.js

─────────────────────────────────────────────
STEP 7.3 — FRONTEND
─────────────────────────────────────────────

Update frontend/components/layout/Header.jsx

Notification bell icon:
  - Red badge with unread count (hidden if 0)
  - Click → dropdown panel slides down
  - Panel shows last 10 notifications:
    Icon by category | Title | Message preview |
    Time ago (e.g. "2 hours ago") | Unread = bold
  - "Mark all as read" button at top of panel
  - "View all notifications" link at bottom
  - Click notification → mark as read + navigate to link
  - Auto-refresh every 60 seconds (poll /api/notifications)

Create frontend/app/(dashboard)/notifications/page.jsx
  Full notifications page
  Filter by: All | Unread | By category
  Each notification as a card with full message
  Mark as read / Delete per notification
  "Clear All" button


═══════════════════════════════════════════════════════════
MODULE 8 — SETTINGS PAGE
═══════════════════════════════════════════════════════════

Create frontend/app/(dashboard)/settings/page.jsx
Admin only. Redirect non-admins to dashboard.

Tabs:

─── Tab 1: Company Settings ───
  Company Name (editable)
  Company Address (editable)
  Company Email (editable)
  Company Website (editable)
  Company Phone (editable)
  Logo Upload (file upload, shown in sidebar)
  Save Changes button → store in a settings table or .env

─── Tab 2: Working Hours ───
  Work Start Time (time picker, default 9:00am)
  Work End Time (time picker, default 5:30pm)
  Late Arrival Threshold (default 9:30am)
  Working Days (checkboxes: Mon-Sun, default Mon-Fri)
  Save button

─── Tab 3: Leave Policy ───
  Annual Leave Days (default 20)
  Sick Leave Days (default 10)
  Personal Leave Days (default 5)
  Leave Year Start Month (default January)
  Save button

─── Tab 4: My Account ───
  Available to all roles.
  Change Password form:
    Current Password
    New Password (min 8 chars, must have
    uppercase + number + special char)
    Confirm New Password
    Save button → PUT /api/auth/change-password

Create backend route: PUT /api/auth/change-password
  Verify current password with bcrypt
  Hash new password and update users table

─── Tab 5: System (Admin only) ───
  Database info display (read only):
    Total staff count
    Total tasks count
    Total payslips generated
    System version
  "Export All Data" button (future feature — show
  "Coming Soon" toast for now)
  Danger Zone:
    "Reset Demo Data" button with double confirmation
    (This will be used when going to production)


═══════════════════════════════════════════════════════════
MODULE 9 — PWA SETUP
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────
STEP 9.1 — NEXT.JS PWA CONFIG
─────────────────────────────────────────────

Install: next-pwa

Update next.config.mjs:
  Import and configure next-pwa
  Cache strategy: NetworkFirst for API calls
  Cache strategy: CacheFirst for static assets
  Disable PWA in development mode

─────────────────────────────────────────────
STEP 9.2 — WEB APP MANIFEST
─────────────────────────────────────────────

Create frontend/public/manifest.json:
{
  "name": "DDinfoways Staff Manager",
  "short_name": "DD Staff",
  "description": "Staff & Work Management for DDinfoways",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1A3A5C",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72",
      "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96",
      "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128",
      "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192",
      "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512",
      "type": "image/png", "purpose": "any maskable" }
  ]
}

─────────────────────────────────────────────
STEP 9.3 — PWA ICONS
─────────────────────────────────────────────

Create frontend/public/icons/ directory.
Generate placeholder PNG icons for all sizes using
a canvas-based Node.js script:
  - Navy background (#1A3A5C)
  - White "DD" text centered
  - Save all 5 sizes

─────────────────────────────────────────────
STEP 9.4 — META TAGS
─────────────────────────────────────────────

Update frontend/app/layout.jsx:
  Add to <head>:
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#1A3A5C" />
    <meta name="apple-mobile-web-app-capable"
          content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style"
          content="black-translucent" />
    <meta name="apple-mobile-web-app-title"
          content="DD Staff" />
    <link rel="apple-touch-icon"
          href="/icons/icon-192.png" />
    <meta name="viewport"
          content="width=device-width,
          initial-scale=1, maximum-scale=1" />

─────────────────────────────────────────────
STEP 9.5 — INSTALL PROMPT
─────────────────────────────────────────────

Create frontend/components/shared/InstallPWA.jsx
  - Listens for beforeinstallprompt event
  - Shows a subtle banner at bottom of screen:
    "Install DDinfoways Staff App for quick access"
    "Install" button | "Dismiss" button
  - Only shows if not already installed
  - Dismissed state saved to localStorage
  - Add to layout.jsx


═══════════════════════════════════════════════════════════
MODULE 10 — MOBILE RESPONSIVE POLISH
═══════════════════════════════════════════════════════════

Go through EVERY page and ensure it works on mobile
(375px width — iPhone SE size):

For each page check and fix:
  - Sidebar collapses to hamburger menu on mobile
  - Tables become horizontal scroll or card stack on mobile
  - Kanban board scrolls horizontally on mobile
  - All modals fit on mobile screen
  - All forms are usable on mobile keyboard
  - Check-in button is large and thumb-friendly
  - Dashboard cards stack to single column on mobile
  - Charts resize properly on mobile

Create a mobile bottom navigation bar for staff role:
  Dashboard | Tasks | Attendance | Profile
  (Shows only on mobile, hidden on desktop)


═══════════════════════════════════════════════════════════
FINAL STEPS AFTER ALL MODULES
═══════════════════════════════════════════════════════════

1. Run ALL migrations in this order:
   backend/db/migration_attendance.sql
   backend/db/migration_leaves.sql
   backend/db/migration_performance.sql
   backend/db/migration_tasks.sql
   backend/db/migration_notifications.sql
   Run each using the multipleStatements: true
   Node.js mysql2 approach

2. Run seed_dummy.sql to populate all tables with
   realistic test data covering all modules

3. Update CLAUDE.md:
   Mark ALL modules as complete
   Update the phase tracker

4. Check for any console errors in:
   - Browser developer console
   - Terminal backend logs
   Fix all errors found

5. Confirm every page loads without errors:
   /dashboard        ✓
   /staff            ✓
   /staff/[id]       ✓
   /staff/idcards    ✓
   /attendance       ✓
   /leaves           ✓
   /performance      ✓
   /tasks            ✓
   /projects         ✓
   /projects/[id]    ✓
   /salary           ✓
   /notifications    ✓
   /settings         ✓

6. Git commit:
   git add .
   git commit -m "feat: complete all remaining modules -
   attendance, leaves, performance, tasks, projects,
   notifications, settings, PWA, mobile responsive"
   git push origin main

7. List every file created and modified

─────────────────────────────────────────────
RULES TO FOLLOW THROUGHOUT
─────────────────────────────────────────────

- Follow ALL conventions in RULES.md and CLAUDE.md
- Standard API response format on every endpoint
- verifyToken on every route
- requireRole where needed
- Staff can only see their own data
- Admin can see all data
- All dates in NZ timezone (Pacific/Auckland)
- All currency in NZD
- Shadcn components for all UI
- Skeleton loaders on every page while loading
- Toast notifications for all actions
- react-hook-form + zod for all forms
- Confirm dialogs before all destructive actions
- No alert() or confirm() anywhere
- Soft delete only — never hard delete
- Mobile responsive — test at 375px width
- No console errors in final build