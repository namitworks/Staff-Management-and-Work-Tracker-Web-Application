# DDinfoways — Coding Rules & Standards
# RULES.md

These rules apply to every file in this project, every time.
No exceptions unless explicitly noted with a comment explaining why.

---

## 1. General Rules

| Rule | Detail |
|------|--------|
| No secrets in code | All secrets in .env — never committed to git |
| No raw errors to client | Catch errors, return safe messages |
| No hard deletes | Use is_deleted = 1 for all delete operations |
| No alert/confirm | Use Shadcn Dialog for confirmations, Sonner for toasts |
| No inline styles | Tailwind classes only |
| No any type guessing | If unsure of a type, ask — don't assume |
| Async/await only | No raw .then() chains anywhere |
| Env validation | Check required env vars on server startup |

---

## 2. File & Folder Rules

```
✅ Components     → /components/[module]/ComponentName.jsx
✅ Pages          → /app/(dashboard)/[module]/page.jsx
✅ API routes     → /backend/src/routes/[module].js
✅ Controllers    → /backend/src/controllers/[module]Controller.js
✅ Middleware     → /backend/src/middleware/[name].js
✅ DB helpers     → /backend/src/models/[Model].js
✅ Shared utils   → /lib/utils.js (frontend) | /src/utils/ (backend)

❌ No logic in page files — extract to components and hooks
❌ No API calls in components — use custom hooks or server actions
❌ No business logic in routes — use controllers
❌ No raw SQL in routes — use model files
```

---

## 3. API Rules

### Request Validation (backend)
Every POST/PUT route must validate the body:
```javascript
// Use express-validator
const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

// In route handler — always check first
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
}
```

### Standard Response (always use this)
```javascript
// Success
res.status(200).json({
  success: true,
  message: 'Staff fetched successfully',
  data: staff,
  meta: { total: 50, page: 1 }   // only for lists
});

// Error
res.status(400).json({
  success: false,
  message: 'Email already exists',
  error: 'DUPLICATE_EMAIL'
});

// Unauthorised
res.status(401).json({
  success: false,
  message: 'Please log in to continue',
  error: 'UNAUTHORISED'
});

// Forbidden
res.status(403).json({
  success: false,
  message: 'You do not have permission to do this',
  error: 'FORBIDDEN'
});
```

### Error Codes (use consistent codes)
```
AUTH_FAILED         — wrong email or password
TOKEN_EXPIRED       — JWT has expired
TOKEN_INVALID       — JWT is malformed
UNAUTHORISED        — not logged in
FORBIDDEN           — logged in but wrong role
NOT_FOUND           — resource not found
DUPLICATE_EMAIL     — email already registered
VALIDATION_FAILED   — request body validation failed
SERVER_ERROR        — unexpected server error
```

---

## 4. Auth Rules

```javascript
// ✅ Always verify token server-side
// ✅ Always check role server-side — never trust frontend role
// ✅ Use requireRole middleware on every protected route
// ✅ Access token: 15 minutes
// ✅ Refresh token: 7 days
// ✅ Refresh tokens must be stored in DB (for invalidation on logout)
// ❌ Never return password hash in any response
// ❌ Never store JWT in localStorage (use memory + httpOnly cookie for refresh)
```

Example route protection:
```javascript
router.get('/staff', verifyToken, requireRole('admin', 'team_lead'), getStaff);
router.post('/staff', verifyToken, requireRole('admin'), createStaff);
router.get('/staff/:id', verifyToken, requireOwnOrAdmin, getStaffById);
```

---

## 5. Frontend Rules

### API Calls
```javascript
// ✅ Always use the axios instance from /lib/api.js
import api from '@/lib/api';
const { data } = await api.get('/staff');

// ❌ Never do this
const res = await fetch('/api/staff');
```

### Forms
```javascript
// ✅ Always use react-hook-form + zod
const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Loading States
```jsx
// ✅ Always show skeleton while loading
if (isLoading) return <StaffTableSkeleton />;
if (error) return <ErrorState message={error.message} />;
if (!data.length) return <EmptyState message="No staff found" />;
return <StaffTable data={data} />;
```

### Toasts
```javascript
// ✅ Use Sonner (installed with Shadcn)
import { toast } from 'sonner';

toast.success('Staff added successfully');
toast.error('Failed to add staff. Please try again.');
```

### Confirm Destructive Actions
```jsx
// ✅ Always use AlertDialog for delete/deactivate
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Deactivate</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogDescription>
      This will deactivate {staff.name}'s account.
    </AlertDialogDescription>
    <AlertDialogAction onClick={handleDeactivate}>Confirm</AlertDialogAction>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>
```

---

## 6. Database Rules

```sql
-- ✅ Always use snake_case
-- ✅ Always add created_at and updated_at to every table
-- ✅ Always add is_deleted BOOLEAN DEFAULT 0 to main tables
-- ✅ Always index foreign keys
-- ✅ Use ENUM for fixed value columns (status, role, type)
-- ✅ Use VARCHAR(255) for names/emails, TEXT for descriptions
-- ❌ Never store plain text passwords
-- ❌ Never use SELECT * in production queries — specify columns

-- All queries must exclude deleted records
SELECT id, name, email FROM users WHERE is_deleted = 0;

-- Soft delete
UPDATE users SET is_deleted = 1, updated_at = NOW() WHERE id = ?;
```

---

## 7. Git Rules

```bash
# ✅ Commit after every working feature — not every file
# ✅ Use the commit format from CLAUDE.md
# ✅ Never commit directly to main
# ✅ Always pull before starting work
# ❌ Never commit .env files
# ❌ Never commit node_modules

# .gitignore must include:
node_modules/
.env
.env.local
.next/
dist/
build/
*.log
```

---

## 8. Security Checklist (before going live)

- [ ] All .env variables set on server — no fallback defaults
- [ ] CORS restricted to frontend domain only
- [ ] Helmet.js enabled on Express
- [ ] Rate limiting on /api/auth/login (max 10 attempts per 15 min)
- [ ] All passwords hashed with bcrypt (rounds: 12)
- [ ] JWT secret is a strong random string (32+ chars)
- [ ] Refresh tokens stored in DB and invalidated on logout
- [ ] No sensitive data in API responses (no password, no internal IDs exposed unnecessarily)
- [ ] All user inputs validated and sanitised
- [ ] SQL queries use parameterised statements (never string concatenation)
- [ ] HTTPS enforced on production
