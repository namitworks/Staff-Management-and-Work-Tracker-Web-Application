# 🚀 DDinfoways Staff & Work Management System

Welcome to the **DDinfoways Management System**. This project is a professional-grade ERP (Enterprise Resource Planning) tool built specifically for staff attendance, project tracking, and HR management.

---

## 📖 Introduction for Junior Developers
If you are new to this project, here is the basic "mental model" of how it works.

### 🏛️ The Architecture
We use a **Decoupled Architecture**, meaning the "Brain" and the "Body" are separate:
1.  **The Backend (The Brain)**: Built with **Node.js + Express**. It sits on port `5000`. It talks to the Database and handles all the rules (e.g., "Only admins can see salaries").
2.  **The Frontend (The Body)**: Built with **Next.js 14**. It sits on port `3000`. It's what the user sees. It "talks" to the Backend via API calls.
3.  **The Database (The Memory)**: Built with **MySQL**. It stores everything permanently.

### 🔑 Authentication Flow
We use **JWT (JSON Web Tokens)**. 
- When you login, the server sends a "Ticket" (the Token).
- The Frontend stores this ticket in the browser's "Cookies".
- Every time the Frontend asks for data (like "Show me staff"), it sends that ticket along so the server knows who is asking.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS (Styling), Lucide React (Icons), Recharts (Charts).
- **Backend**: Node.js, Express, MySQL2 (Database Driver).
- **Security**: Bcrypt (Password hashing), JWT (Token-based auth).

---

## 📋 Folder Structure
```text
/backend
  ├── /db            <-- Database configuration & SQL files
  ├── /src
      ├── /controllers <-- Logic for each feature (The "Action")
      ├── /routes      <-- URL maps (The "Address")
      └── /middleware  <-- Checks (e.g., "Is this person logged in?")
/frontend
  ├── /app           <-- Pages and layout logic
  ├── /components    <-- Reusable UI pieces (Buttons, Cards)
  └── /lib           <-- Tooling (API setup, Auth helpers)
```

---

## 🚀 Getting Started (Local Development)

### 1. Database Setup
1. Open your MySQL client (MySQL Workbench, XAMPP, etc.).
2. Create a database: `CREATE DATABASE ddinfoways_db;`.
3. Run the scripts in order:
    - First: `backend/db/schema.sql` (Creates tables).
    - Second: `backend/db/seed.sql` (Adds the first items and Admin).

### 2. Backend Setup
1. Go to `/backend` folder.
2. Create a `.env` file (see `.env.example` if it exists):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ddinfoways_db
   JWT_SECRET=any_random_long_string
   PORT=5000
   ```
3. Run `npm install` and then `npm run dev`.

### 3. Frontend Setup
1. Go to `/frontend` folder.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).

---

## 🔐 Default Credentials
- **Admin Email**: `admin@ddinfoways.co.nz`
- **Admin Password**: `Admin@123`
- **New Staff**: [Email selected by Admin] / Default Password: `Password@123`

---

## 🌐 Hosting on aaPanel
For detailed hosting instructions, please refer to: [HOSTING_GUIDE.md](./HOSTING_GUIDE.md).

### Quick Hosting Notes:
1. Use **Node.js Manager** in aaPanel.
2. Keep Backend on port 5000 and Frontend on port 3000 (or mapped domains).
3. Ensure MySQL version is 5.7 or 8.0.
4. Always enable **SSL** for security.

---

## 👨‍💻 Junior Dev Tips
- **Console is your friend**: If something doesn't show up, check the "Inspect" -> "Console" in your browser.
- **Network Tab**: If the stats are 0, check the "Network" tab to see if the API `dashboard/stats` is returning an error.
- **Database Logic**: We use "Soft Deletes". This means we don't actually delete staff; we just set `is_deleted = 1` in the database.

---
*Created for DDinfoways Limited.*
