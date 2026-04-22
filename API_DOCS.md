# 📘 DDinfoways API Documentation

This document lists all available API endpoints, their expected payloads, and authentication requirements.

**Base URL**: `http://localhost:5000/api` (Local) or `https://api.yourdomain.com/api` (Production)

---

## 🔑 Authentication
All endpoints except `/auth/login` and `/auth/refresh` require an `Authorization` header:
`Authorization: Bearer <your_access_token>`

### 1. User Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Payload**:
  ```json
  { "email": "admin@ddinfoways.co.nz", "password": "Admin@123" }
  ```
- **Response**: Returns `accessToken`, `refreshToken`, and `user` object.

### 2. Get Current User
- **URL**: `/auth/me`
- **Method**: `GET`
- **Description**: Returns the profile of the currently logged-in user.

### 3. Update Profile
- **URL**: `/auth/update-profile`
- **Method**: `PUT`
- **Payload**: `{ "name": "...", "email": "...", "phone": "...", "address": "..." }`

---

## 👥 Staff Management (Admin/Manager Only)
### 1. List All Staff
- **URL**: `/staff`
- **Method**: `GET`

### 2. Create Staff
- **URL**: `/staff`
- **Method**: `POST`
- **Payload**:
  ```json
  { "name": "...", "email": "...", "password": "...", "role": "staff/team_lead", "department": "..." }
  ```

---

## 📅 Attendance
### 1. Check-In
- **URL**: `/attendance/check-in`
- **Method**: `POST`
- **Description**: Records current time as check-in for the logged-in user.

### 2. Check-Out
- **URL**: `/attendance/check-out`
- **Method**: `POST`
- **Description**: Calculates session duration and updates the record.

---

## 🏖️ Leave Management
### 1. Apply for Leave
- **URL**: `/leaves`
- **Method**: `POST`
- **Payload**:
  ```json
  { "type": "annual/sick/casual", "from_date": "YYYY-MM-DD", "to_date": "YYYY-MM-DD", "reason": "..." }
  ```

### 2. Update Leave Status (Admin/Manager Only)
- **URL**: `/leaves/:id/status`
- **Method**: `PUT`
- **Payload**: `{ "status": "approved/rejected" }`

---

## 💰 Salary (Admin/Manager Only)
### 1. Add Salary Record
- **URL**: `/salary`
- **Method**: `POST`
- **Payload**: `{ "user_id": 1, "month": 5, "year": 2024, "amount": 5000, "status": "paid/unpaid" }`

### 2. Get Salary History
- **URL**: `/salary/user/:userId`
- **Method**: `GET`

---

## 📈 Performance (Admin/Manager Only)
### 1. Add Rating
- **URL**: `/performance`
- **Method**: `POST`
- **Payload**: `{ "user_id": 1, "rating": 5, "note": "Excellent work!" }`

---

## 🚀 Dashboard
### 1. Get Summary Stats
- **URL**: `/dashboard/stats`
- **Method**: `GET`
- **Description**: Returns aggregated metrics (Total Staff, Tasks, Trends) filtered by the requester's role.
