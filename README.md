# Cloud Based Campus Complaint Management System

## 🚀 Quick Setup Guide

### Prerequisites
- Node.js v18+
- MySQL 8.0+

---

## Step 1 — Database Setup

1. Open MySQL shell / MySQL Workbench
2. Run the schema:
```sql
SOURCE C:/Users/Nanda/Cloud-Complaint-Management/server/schema.sql
```
Or copy-paste the contents of `server/schema.sql`.

---

## Step 2 — Configure Backend Environment

Edit `server/.env` with your MySQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=complaint_db
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

---

## Step 3 — Seed Admin Account

```bash
cd server
npm run seed
```
This creates: `admin@campus.edu` / `Admin@123`

---

## Step 4 — Start Backend

```bash
cd server
npm run dev
```
Server runs at: http://localhost:5000

---

## Step 5 — Start Frontend

```bash
cd client
npm run dev
```
App runs at: http://localhost:5173

---

## 🏗️ Project Structure

```
Cloud-Complaint-Management/
├── server/
│   ├── config/db.js            # MySQL pool
│   ├── controllers/
│   │   ├── authController.js   # Register/Login
│   │   ├── complaintController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verify
│   │   ├── role.js             # isStudent/isAdmin
│   │   ├── upload.js           # Multer
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   └── users.js
│   ├── uploads/                # Uploaded images
│   ├── index.js                # Entry point + Socket.IO
│   ├── schema.sql
│   ├── seed.js
│   └── .env
│
└── client/
    └── src/
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   ├── Navbar.jsx
        │   ├── StatusBadge.jsx
        │   ├── StatCard.jsx
        │   ├── ConfirmModal.jsx
        │   ├── Pagination.jsx
        │   ├── LoadingSpinner.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── ThemeContext.jsx
        │   └── SocketContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── StudentDashboard.jsx
        │   ├── AdminDashboard.jsx
        │   ├── AddComplaint.jsx
        │   ├── TrackComplaint.jsx
        │   └── Profile.jsx
        ├── services/api.js
        └── utils/formatDate.js
```

---

## 🔑 Default Credentials

| Role    | Email              | Password  |
|---------|--------------------|-----------|
| Admin   | admin@campus.edu   | Admin@123 |
| Student | Register yourself  | —         |

---

## 🌐 API Endpoints

| Method | Endpoint                       | Auth     | Role    |
|--------|--------------------------------|----------|---------|
| POST   | /api/auth/register             | No       | Public  |
| POST   | /api/auth/login                | No       | Public  |
| POST   | /api/auth/admin/login          | No       | Public  |
| GET    | /api/users/profile             | JWT      | Student |
| GET    | /api/users/admin/profile       | JWT      | Admin   |
| POST   | /api/complaints                | JWT      | Student |
| GET    | /api/complaints/student        | JWT      | Student |
| GET    | /api/complaints/all            | JWT      | Admin   |
| PUT    | /api/complaints/:id/status     | JWT      | Admin   |
| PUT    | /api/complaints/:id/note       | JWT      | Admin   |

---

## ⚡ Socket.IO Events

| Event            | Emitted by | Received by | Description                          |
|------------------|------------|-------------|--------------------------------------|
| complaintUpdated | Server     | All clients | Fires when admin updates status/note |
