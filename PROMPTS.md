# DDinfoways — Claude Code Prompt Library
# PROMPTS.md

Copy and paste these prompts directly into Claude Code.
Always start a new session with the Context Primer below.

---

## Context Primer (run this first in every new Claude Code session)

```
Read CLAUDE.md, RULES.md, and WORKFLOW.md in this project root.
Understand the full stack, conventions, and current build phase before doing anything.
Confirm you have read them by summarising: stack, current phase, and the 3 most important rules.
```

---

## Debugging Prompts

```
There is a bug on this page: [page name]
Here is the error: [paste error]
Here is the relevant code: [paste code or say "read the file at [path]"]
Fix it following the rules in RULES.md.
```

```
The API route [method] [path] is returning [wrong response].
Expected: [what you expected]
Actual: [what you got]
Read the controller and fix it.
```

```
The form on [page] is not validating correctly.
The issue is: [describe issue]
We use react-hook-form + zod. Fix the schema and form logic.
```

---

## Feature Addition Prompts

```
Add a search bar to [page] that filters [what] by [field] in real time.
Use the existing Shadcn Input component. Do not change the table structure.
```

```
Add pagination to the [staff/tasks/leaves] table.
Show 10 records per page. Add Previous/Next buttons using Shadcn Pagination.
Update the API route to accept ?page= and ?limit= query params.
```

```
Add an export to CSV button to the [page] table.
Export all current filtered results (not just the current page).
Use a simple CSV generation — no external library needed.
```

```
Add email notifications when a leave request is approved or rejected.
Use Nodemailer. Read the .env for SMTP config.
Send to the staff member's email with the decision and dates.
```

---

## Code Review Prompts

```
Review the file at [path] for:
1. Security issues
2. Missing error handling
3. Violations of RULES.md
List all issues with line numbers and suggested fixes.
```

```
Review all API routes in /backend/src/routes/ and check:
1. Every route has auth middleware
2. Every route has role middleware where needed
3. Every route validates the request body
List any routes that are missing these.
```

---

## Refactor Prompts

```
The component at [path] is too large (over 200 lines).
Break it into smaller components following the structure in CLAUDE.md.
Keep the same functionality — just split the code.
```

```
Extract the API call logic from [component] into a custom hook at
/hooks/use[Name].js. The hook should handle loading, error, and data states.
```

---

## Database Prompts

```
Write a MySQL migration to add [column name] [type] to the [table] table.
Add it after the [existing column] column.
Also update the corresponding model file.
```

```
Create seed data in /backend/db/seed.sql with:
- 1 admin user (email: admin@ddinfoways.co.nz, password: Admin@123)
- 4 staff members with profiles
- 3 projects (1 website build, 1 POS onboarding, 1 support)
- 10 tasks spread across the projects and staff
- Attendance records for the last 7 days for all staff
Hash passwords with bcrypt rounds 12.
```

---

## UI Polish Prompts

```
The [page] looks plain. Make it MNC-grade:
- Add proper section headings
- Add status badges with colors matching RULES.md color scheme
- Add hover states on table rows
- Make sure empty state has an icon and helpful message
- Add subtle card shadows
Keep all existing functionality intact.
```

```
Add skeleton loaders to [page].
While data is loading, show [number] skeleton rows in the table
using Shadcn Skeleton component.
The skeleton should match the shape of the actual content.
```

---

## Common One-Liners

```
Add a loading spinner to the submit button on the [form name] form.
Disable the button while the form is submitting.
```

```
The sidebar active state is not highlighting correctly on [page].
Fix it using the current pathname from usePathname().
```

```
Add a confirmation modal before deactivating a staff member.
Use Shadcn AlertDialog. Only deactivate after the admin confirms.
```

```
The date on [page] is showing in UTC. Convert it to NZ timezone (Pacific/Auckland)
using date-fns and the formatInTimeZone function.
```

```
Add a role badge to the staff table. 
Admin = blue, Team Lead = purple, Staff = gray.
Use Shadcn Badge component with custom variant classes.
```
