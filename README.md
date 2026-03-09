# 🛡️ AttendGuard — Smart Attendance System

> A secure, hardware-free, web-based attendance management platform for colleges using **biometric authentication (WebAuthn)** and **GPS geofencing**.

[![Built with MERN](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://www.mongodb.com/mern-stack)
[![WebAuthn](https://img.shields.io/badge/Auth-WebAuthn%20FIDO2-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://webauthn.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)](LICENSE)

---

## 📖 About

**AttendGuard** eliminates proxy attendance using a dual-verification system. Students mark attendance through their device's built-in biometrics (fingerprint / Face ID) powered by **WebAuthn (FIDO2)**, combined with **GPS geofencing** — all from a standard web browser with zero additional hardware.

**Author:** NAVEENKUMAR T — Sri Sairam Institute Of Technology

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **WebAuthn Biometric Auth** | Fingerprint / Face ID via browser — no biometric data stored on server |
| 📍 **GPS Geofencing** | Haversine-based location verification within campus radius |
| 👥 **3-Tier Role System** | HOD → Teacher → Student with scoped permissions |
| 📊 **Real-Time Attendance** | Live tracking with session management |
| 🔒 **4-Layer Security** | Session check → GPS verify → Biometric verify → Duplicate guard |
| 📱 **Responsive UI** | Modern React interface with dark mode support |

---

## 🏗️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express.js `v5` | REST API framework |
| MongoDB + Mongoose `v9` | Database & ODM |
| @simplewebauthn/server | WebAuthn server-side verification |
| JSON Web Token | Authentication & session management |
| bcryptjs | Password hashing |
| express-validator | Input validation |

### Frontend
| Package | Purpose |
|---|---|
| React `v19` | UI framework |
| Vite `v7` | Build tool & dev server |
| @simplewebauthn/browser | WebAuthn browser API wrapper |
| React Router DOM `v7` | Client-side routing |
| Zustand | Lightweight state management |
| Axios | HTTP client |
| React Icons | Icon library |

---

## 📁 Project Structure

```
Smart-Attendance-System/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Login & JWT
│   │   ├── hodController.js         # HOD CRUD operations
│   │   ├── teacherController.js     # Teacher routes logic
│   │   ├── studentController.js     # Student routes logic
│   │   └── webauthnController.js    # WebAuthn registration & auth
│   ├── middleware/
│   │   ├── verifyToken.js           # JWT validation
│   │   └── roleGuard.js            # Role-based access control
│   ├── models/
│   │   ├── Department.js
│   │   ├── Class.js
│   │   ├── Subject.js
│   │   ├── User.js                  # Teachers + Students
│   │   ├── TeacherClassSubject.js   # Teacher-Class-Subject mapping
│   │   ├── StudentClassSubject.js   # Student enrollment
│   │   ├── AttendanceSession.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── hod.js
│   │   ├── teacher.js
│   │   ├── student.js
│   │   └── webauthn.js
│   ├── utils/
│   │   ├── haversine.js             # GPS distance calculation
│   │   └── webauthnHelpers.js
│   ├── seed.js                      # Database seeder
│   └── server.js                    # Entry point
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx          # Navigation sidebar
│       │   └── ProtectedRoute.jsx   # Auth route guard
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── hod/HODPages.jsx
│       │   ├── teacher/TeacherPages.jsx
│       │   └── student/StudentPages.jsx
│       ├── store/authStore.js       # Zustand auth state
│       ├── utils/api.js             # Axios instance
│       ├── App.jsx                  # Router setup
│       ├── index.css                # Global styles
│       └── main.jsx                 # Entry point
│
├── .gitignore
└── REDME.md
```

---

## 🔐 Security Architecture

AttendGuard uses a **4-layer sequential verification** for every attendance mark:

```
┌─────────────────────────────────────────────────────┐
│  Layer 1 — Session Check                            │
│  Validate session is open + student is enrolled     │
├─────────────────────────────────────────────────────┤
│  Layer 2 — GPS Geofence                             │
│  Haversine distance ≤ campus radius                 │
├─────────────────────────────────────────────────────┤
│  Layer 3 — WebAuthn Biometric                       │
│  Verify assertion with stored public key            │
├─────────────────────────────────────────────────────┤
│  Layer 4 — Duplicate Guard                          │
│  Unique index on { sessionId, studentId }           │
└─────────────────────────────────────────────────────┘
```

> **Note:** Biometric data (fingerprint/face) **never leaves the device**. Only a cryptographic signature is sent to the server for verification.

---

## 👥 Role Hierarchy

```
Department (HOD)
  └─ Creates Classes (Year + Section)
  └─ Creates Subjects
  └─ Adds Teachers → maps Teacher : Class : Subject
  └─ Adds Students → enrolls Student : Class : Subjects

Teacher
  └─ Views assigned Classes + Subjects
  └─ Opens/Closes attendance sessions
  └─ Views live attendance & reports

Student
  └─ Views enrolled subjects
  └─ Marks attendance via WebAuthn + GPS
  └─ Views attendance history & percentage
```

---

## 📋 Attendance Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | HOD | Creates class, subject, teacher mapping, student enrollment |
| 2 | Teacher / HOD | Opens attendance session for a subject + class |
| 3 | System | Pre-inserts `ABSENT` records for all enrolled students |
| 4 | Student | Opens app → clicks **Mark Attendance** |
| 5 | Browser | Fetches GPS coordinates |
| 6 | Backend | Validates GPS within campus radius (Haversine) |
| 7 | Browser | Triggers WebAuthn fingerprint / Face ID prompt |
| 8 | Backend | Verifies WebAuthn assertion against stored credential |
| 9 | System | Updates student record: `ABSENT` → `PRESENT` |
| 10 | Teacher / HOD | Closes session — no more marks accepted |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or MongoDB Atlas)
- **HTTPS** required for WebAuthn in production (`localhost` works for development)

### 1. Clone the Repository

```bash
git clone https://github.com/NAVEENKUMAR-T-GIT-28/Smart-Attendance-System.git
cd Smart-Attendance-System
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/Attendguard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=8h
PORT=5000
CAMPUS_LAT=12.961728
CAMPUS_LON=80.059083
CAMPUS_RADIUS=151.75
RP_ID=localhost
RP_NAME=AttendGuard
ORIGIN=http://localhost:5173
```

Start the backend server:

```bash
npm run start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Seed the Database (Optional)

```bash
cd backend
node seed.js
```

---

## 🌐 API Endpoints

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login — returns JWT |

</details>

<details>
<summary><strong>WebAuthn (Students)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webauthn/register-options` | Get registration challenge |
| POST | `/api/webauthn/register-verify` | Verify & save credential |
| POST | `/api/webauthn/auth-options` | Get authentication challenge |
| POST | `/api/webauthn/auth-verify` | Verify assertion |

</details>

<details>
<summary><strong>HOD Routes</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hod/classes` | Create class |
| GET | `/api/hod/classes` | List all classes |
| POST | `/api/hod/subjects` | Create subject |
| GET | `/api/hod/subjects` | List all subjects |
| POST | `/api/hod/users` | Add teacher or student |
| GET | `/api/hod/users` | List users (filterable) |
| PUT | `/api/hod/users/:id` | Update user |
| DELETE | `/api/hod/users/:id` | Remove user |
| POST | `/api/hod/mappings` | Assign teacher → class → subject |
| GET | `/api/hod/mappings` | View all mappings |
| POST | `/api/hod/enrollments` | Enroll student |
| GET | `/api/hod/attendance/report` | Attendance report |
| POST | `/api/hod/session/start` | Open session |
| PUT | `/api/hod/session/:id/close` | Close session |

</details>

<details>
<summary><strong>Teacher Routes</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/classes` | Get assigned classes |
| POST | `/api/teacher/session/start` | Open attendance session |
| PUT | `/api/teacher/session/:id/close` | Close session |
| GET | `/api/teacher/session/:id/attendance` | View live attendance |
| GET | `/api/teacher/reports` | Attendance reports |

</details>

<details>
<summary><strong>Student Routes</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/subjects` | Get enrolled subjects |
| GET | `/api/student/session/active` | Check active sessions |
| POST | `/api/student/attendance/mark` | Mark attendance |
| GET | `/api/student/attendance/my` | Attendance history |
| GET | `/api/student/attendance/percentage` | Subject-wise percentage |

</details>

---

## 📊 Database Schema

The system uses **8 MongoDB collections**:

| Collection | Purpose |
|---|---|
| `departments` | HOD login & department info |
| `classes` | Year + Section per department |
| `subjects` | Subject master per department |
| `users` | Teachers & Students (role-based) |
| `teacher_class_subjects` | Teacher ↔ Class ↔ Subject mapping |
| `student_class_subjects` | Student enrollment per subject |
| `attendance_sessions` | One session per subject/class/day |
| `attendance` | Individual student attendance records |

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  <strong>AttendGuard</strong> — Built with ❤️ by <strong>NAVEENKUMAR T</strong><br>
  Sri Sairam Institute Of Technology
</p>
