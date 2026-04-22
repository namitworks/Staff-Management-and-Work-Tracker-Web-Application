# 🏗️ DDinfoways System Architecture & Logic

This document provides an in-depth technical breakdown of how the Staff Management System is structured, how data flows, and how the security logic is implemented.

---

## 🌓 High-Level Overview
The system follows a **Modular Monolith** pattern for the backend and a **Client-Side Rendering (CSR) with Server-Side Routing** pattern for the frontend using Next.js 14.

### 📡 The Communication Layer (API)
- **RESTful Principles**: The frontend communicates with the backend via a REST API hosted at `/api`.
- **Axios Instance**: All frontend requests go through a central `api` instance in `frontend/lib/api.js` which automatically attaches the `Bearer <token>` from cookies to every request.

---

## 🧠 Backend Architecture (The Brain)
Built with **Node.js, Express, and MySQL**.

### 🔧 1. Entry Point (`backend/server.js`)
The server initializes:
- **Helmet**: Secures HTTP headers.
- **CORS**: Restricted to the frontend domain.
- **Morgan**: Logs every incoming request for debugging.
- **Registry**: Maps route files (e.g., `/api/auth`) to their respective logic controllers.

### 🛡️ 2. Security Middleware (`backend/src/middleware/auth.js`)
This is the gatekeeper.
- **verification**: It intercept every request, looks for the `Authorization` header, and verifies the JWT.
- **Injection**: If the token is valid, it "injects" the decrypted user info (`id`, `role`) into the `req.user` object. This allows controllers to know exactly who is making the request.

### 🎮 3. Controller Layer (`backend/src/controllers/`)
Controllers handle the "Business Logic".
- **RBAC (Role Based Access Control)**: Controllers check `req.user.role`.
  - *Example*: In `salaryController.js`, we check `if (role !== 'admin')` before allowing a payroll update.
- **Data Fetching**: We use a **Connection Pool** (`mysql2/promise`) for high performance and to prevent "too many connections" errors.
- **Error Handling**: Every controller is wrapped in a `try-catch` block to ensure that if a database query fails, the server doesn't crash, and the user receives a clean `500 SERVER_ERROR` response.

---

## 🎨 Frontend Architecture (The Body)
Built with **Next.js 14 (App Router) & Tailwind CSS**.

### 📂 1. Routing Strategy
- **Groups**: 
  - `(auth)`: Contains login/register pages. These have no sidebar.
  - `(dashboard)`: Contains all management pages. These share a common `layout.jsx` that includes the Sidebar and Header.
- **Guards**: The `(dashboard)/layout.jsx` component checks for a JWT token on mount. If no token exists, it redirects the user to `/login`.

### 🧩 2. Component Design
- **Atomic Components**: Button, Input, Card, Badge are stored in `components/ui` for consistency.
- **Layout Components**: 
  - `Sidebar.jsx`: Handles role-based visibility. It filters the `navItems` array based on the user's role before rendering.
  - `Header.jsx`: Dynamically fetches the user profile to show the correct name/email.

### 📊 3. Data Visualization
- **Recharts**: We use Recharts for the Dashboard charts.
- **Telemtry Logic**: The Dashboard doesn't just show "static" numbers; it asks the Backend for a summary, then maps those numbers into the chart's `data` format.

---

## 🎲 Database Logic (The Memory)
We use a **Relational Schema** with Foreign Key constraints.

### 🔗 Key Relationships
1.  **Users ↔️ Staff Profiles**: One-to-one relationship via `user_id`. `Users` holds login info (email/hashed pass), while `Staff_Profiles` holds HR info (phone/dept).
2.  **Users ↔️ Tasks**: One-to-many. Tasks are "Assigned To" a user ID.
3.  **Users ↔️ Attendance**: Many-to-many (over time). Each row links a `user_id` to a specific `date`.

### 🗑️ Soft Deletes
We never use `DELETE FROM`. Instead, we use an `is_deleted` (TINYINT) flag.
- **Why?**: To preserve historical data for reports (e.g., if a staff member leaves, we still need their attendance records for the last year).

---

## 🛠️ Typical Request Flow (Example: "Apply for Leave")
1.  **Frontend**: User fills the form in `LeavesPage.jsx` and clicks "Submit".
2.  **API**: Axios sends a `POST` request to `/api/leaves` with the form data.
3.  **Middleware**: `verifyToken.js` checks the user's login. If OK, it passes the request to the controller.
4.  **Controller**: `leaveController.js` validates that `from_date` and `to_date` are present.
5.  **Database**: It runs an `INSERT INTO leaves` query.
6.  **Response**: Frontend receives `201 Created` and refreshes the leave list.

---
*Documented for DDinfoways Limited Development Team.*
