# DDinfoways Hosting Guide (aaPanel)

This guide explains how to host the Staff Management System on a server using **aaPanel**.

## Prerequisites
- A Linux Server (Ubuntu/CentOS recommended) with **aaPanel** installed.
- **Node.js Manager** installed in aaPanel App Store.
- **MySQL** (version 8.0 or 5.7) installed in aaPanel.
- A Domain name pointed to your server's IP.

---

## 1. Database Setup
1. Open aaPanel -> **Databases** -> **Add Database**.
2. Name: `ddinfoways_db` (or your preferred name).
3. Set a username and password (keep these for later).
4. Click on **Import** or **Query** and run the contents of `backend/db/schema.sql` and `backend/db/seed.sql` to initialize the tables and admin user.

---

## 2. Deploy Backend (Node.js)
1. In aaPanel, go to **Website** -> **Node project** -> **Add Node project**.
2. **Project Path**: Upload the `backend` folder to your server and select its path.
3. **Project Name**: `ddinfoways-api`.
4. **Run Command**: `npm run start` (Make sure you've run `npm install` inside the backend folder first).
5. **Port**: `5000`.
6. **Domain**: Add your API domain (e.g., `api.yourdomain.com`).
7. **Environment Variables**: Create a `.env` file in the `backend` folder on the server:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=ddinfoways_db
   JWT_SECRET=super_secret_key_change_this
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.com
   ```
8. Enable **Mapping** and **SSL** for the API domain.

---

## 3. Deploy Frontend (Next.js)
Because Next.js is a React framework, you have two options: **Static Export** or **SSR**.

### Option A: Static Export (Recommended for simple aaPanel hosting)
1. Run `npm run build` locally in your `frontend` folder.
2. Ensure you have `output: 'export'` in your `next.config.mjs` (if it supports it) or simply build it as a standard project.
3. Upload the contents of the `frontend/out` folder to a standard aaPanel "PHP Project" (since it's just HTML/JS).
4. **Configure API URL**: Before building, set `NEXT_PUBLIC_API_URL` to your production API URL.

### Option B: Node Project (For SSR)
1. Go to **Website** -> **Node project** -> **Add Node project**.
2. **Project Path**: Select the `frontend` folder.
3. **Run Command**: `npm run start`.
4. **Port**: `3000`.
5. **Domain**: `yourdomain.com`.
6. Set up a reverse proxy or mapping in aaPanel.

---

## 4. Final Security Checklist
- [ ] Change the `JWT_SECRET` in `.env`.
- [ ] Enable **SSL (Let's Encrypt)** for both Frontend and Backend domains in aaPanel.
- [ ] Ensure aaPanel **Security** tab allows traffic on ports 80, 443, 5000, and 3000.
