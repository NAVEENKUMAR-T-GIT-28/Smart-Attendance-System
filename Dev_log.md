# AttendGuard — Developer Log
**Author:** NAVEENKUMAR T · Sri Sairam Engineering College  
**Stack:** MongoDB · Express.js · React (Vite) · Node.js · WebAuthn (FIDO2) · GPS Geofencing  
**Date:** March 7, 2026  

---

## 1. Project Overview

AttendGuard is a **secure, hardware-free attendance management platform** for colleges. Students mark attendance using **device biometrics (WebAuthn — fingerprint / Face ID)** verified by **GPS geofencing** — all from a standard web browser.

### Key Specs

| Dimension | Detail |
|-----------|--------|
| **Auth Method** | JWT + WebAuthn (FIDO2) |
| **Location Method** | GPS Geofencing (Haversine formula) |
| **Campus GPS** | Lat `12.961728` · Lon `80.059083` · Radius `151.75 m` |
| **Roles** | HOD (admin) · Teacher · Student |
| **DB Collections** | 8 (departments, classes, subjects, users, mappings, enrollments, sessions, attendance) |

---

## 2. Architecture

### 2.1 Role Hierarchy

```
Department (HOD Login)
    └─ Creates Classes (Year + Section)
    └─ Creates Subjects
    └─ Adds Teachers → maps Teacher : Class : Subject
    └─ Adds Students → enrolls Student : Class : Subjects

Teacher
    └─ Sees only mapped Classes + Subjects
    └─ Opens attendance session → Students mark attendance

Student
    └─ Sees only enrolled subjects
    └─ Marks attendance via WebAuthn + GPS check
```

### 2.2 Attendance Flow

```
1. HOD/Teacher → Opens attendance session
2. System → Pre-inserts ABSENT records for all enrolled students
3. Student → Taps "Mark Attendance"
4. Browser → Fetches GPS coordinates
5. Backend → Validates GPS within campus radius (Haversine)
6. Browser → Triggers WebAuthn fingerprint/Face ID
7. Backend → Verifies WebAuthn assertion against stored public key
8. System → Updates student record: ABSENT → PRESENT
9. Teacher/HOD → Closes session → no more marks accepted
```

### 2.3 Security Layers

Every attendance mark passes all 4 layers sequentially:

| Layer | Method | Prevents |
|-------|--------|----------|
| 1 — Session Check | Validate session is open + student enrolled | Marking outside class time |
| 2 — GPS Geofence | Haversine distance ≤ 151.75 m | Marking from hostel/home |
| 3 — WebAuthn Biometric | Verify assertion with stored public key | Proxy attendance |
| 4 — Duplicate Guard | Unique index `{ sessionId, studentId }` | Marking twice |

---

## 3. File Structure

### 3.1 Backend

```
backend/
├── config/
│   └── db.js                    # MongoDB connection (Mongoose)
├── models/
│   ├── Department.js            # HOD login + dept info
│   ├── Class.js                 # Year + Section (auto-label, compound unique index)
│   ├── Subject.js               # Subject master (unique code per dept)
│   ├── User.js                  # Teachers + Students (role field, WebAuthn devices[])
│   ├── TeacherClassSubject.js   # Teacher → Class → Subject mapping
│   ├── StudentClassSubject.js   # Student enrollment
│   ├── AttendanceSession.js     # One session per subject/class/day
│   └── Attendance.js            # Individual attendance records (default: absent)
├── controllers/
│   ├── authController.js        # Login (all roles) + department registration
│   ├── hodController.js         # Full CRUD: classes, subjects, users, mappings, enrollments, sessions, reports
│   ├── webauthnController.js    # Register-options, register-verify, auth-options, auth-verify
│   ├── teacherController.js     # Assigned classes, sessions, live attendance, reports
│   └── studentController.js     # Subjects, active sessions, mark attendance, history, percentage
├── routes/
│   ├── auth.js                  # POST /api/auth/login, POST /api/auth/register-department
│   ├── hod.js                   # 15 endpoints (CRUD + sessions + reports)
│   ├── webauthn.js              # 4 WebAuthn endpoints
│   ├── teacher.js               # 6 endpoints
│   └── student.js               # 6 endpoints
├── middleware/
│   ├── verifyToken.js           # JWT validation → extracts userId, role, departmentId
│   └── roleGuard.js             # Role-based access control
├── utils/
│   ├── haversine.js             # GPS distance (Haversine formula) + campus check
│   └── webauthnHelpers.js       # Challenge generation + RP config
├── .env                         # Environment variables
├── package.json
└── server.js                    # Express server entry point
```

### 3.2 Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Sidebar with NavLink active state + logout
│   │   └── ProtectedRoute.jsx   # Auth + role guard for routes
│   ├── pages/
│   │   ├── LoginPage.jsx        # Role tabs (HOD/Teacher/Student), brand panel
│   │   ├── hod/
│   │   │   └── HODPages.jsx     # Layout + 9 page components (Dashboard, Classes, Subjects, Teachers, Students, Mappings, Enrollments, Sessions, Reports)
│   │   ├── teacher/
│   │   │   └── TeacherPages.jsx # Layout + 4 page components (Dashboard, MyClasses, LiveSession, Reports)
│   │   └── student/
│   │       └── StudentPages.jsx # Mobile-first dashboard, WebAuthn registration, multi-step attendance
│   ├── store/
│   │   └── authStore.js         # Zustand store (token + user in localStorage)
│   ├── utils/
│   │   └── api.js               # Axios with JWT interceptor + auto-logout on 401
│   ├── index.css                # Full design system (500+ lines, all tokens from HTML reference)
│   ├── main.jsx                 # Entry point
│   └── App.jsx                  # React Router with role-based routing
├── package.json
└── vite.config.js
```

---

## 4. Database Schema

### departments
```javascript
{ _id, name, code (unique), hodName, email (unique), password (bcrypt), createdAt }
```

### classes
```javascript
{ _id, departmentId, year (1–4), section, label (auto), createdAt }
// Index: { departmentId, year, section } → unique
```

### subjects
```javascript
{ _id, departmentId, name, code, createdAt }
// Index: { departmentId, code } → unique
```

### users
```javascript
{ _id, departmentId, name, email (unique), password, role ('teacher'|'student'),
  registerNumber, staffId, currentChallenge,
  devices: [{ credentialID, credentialPublicKey, counter, transports }],
  createdAt, updatedAt }
```

### teacher_class_subjects
```javascript
{ _id, teacherId, classId, subjectId, departmentId, createdAt }
// Index: { teacherId, classId, subjectId } → unique
```

### student_class_subjects
```javascript
{ _id, studentId, classId, subjectId, departmentId, createdAt }
// Index: { studentId, classId, subjectId } → unique
```

### attendance_sessions
```javascript
{ _id, departmentId, classId, subjectId, teacherId, startedBy, date, startTime, endTime, status ('open'|'closed'), createdAt }
// Index: { classId, subjectId, date } → unique
```

### attendance
```javascript
{ _id, sessionId, studentId, classId, subjectId, departmentId, date, status ('present'|'absent'), markedAt, gpsVerified, biometricVerified, createdAt }
// Index: { sessionId, studentId } → unique
```

---

## 5. API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login — returns JWT (role determines dashboard) |
| POST | `/api/auth/register-department` | Seed route — create initial HOD account |

### WebAuthn (Student only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webauthn/register-options` | Get challenge for device registration |
| POST | `/api/webauthn/register-verify` | Verify & save credential |
| POST | `/api/webauthn/auth-options` | Get challenge for authentication |
| POST | `/api/webauthn/auth-verify` | Verify assertion |

### HOD
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hod/classes` | Create class |
| GET | `/api/hod/classes` | List all classes |
| DELETE | `/api/hod/classes/:id` | Delete class |
| POST | `/api/hod/subjects` | Create subject |
| GET | `/api/hod/subjects` | List all subjects |
| DELETE | `/api/hod/subjects/:id` | Delete subject |
| POST | `/api/hod/users` | Add teacher or student |
| GET | `/api/hod/users` | List users (filterable by role) |
| PUT | `/api/hod/users/:id` | Update user |
| DELETE | `/api/hod/users/:id` | Delete user |
| POST | `/api/hod/mappings` | Assign teacher → class → subject |
| GET | `/api/hod/mappings` | List all mappings |
| DELETE | `/api/hod/mappings/:id` | Delete mapping |
| POST | `/api/hod/enrollments` | Enroll student → class → subjects |
| GET | `/api/hod/enrollments` | List enrollments |
| DELETE | `/api/hod/enrollments/:id` | Delete enrollment |
| POST | `/api/hod/session/start` | Open attendance session |
| PUT | `/api/hod/session/:id/close` | Close session |
| GET | `/api/hod/attendance/report` | Attendance report (filterable) |
| GET | `/api/hod/dashboard` | Dashboard stats |

### Teacher
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/classes` | Get assigned classes |
| GET | `/api/teacher/dashboard` | Dashboard stats |
| POST | `/api/teacher/session/start` | Open session |
| PUT | `/api/teacher/session/:id/close` | Close session |
| GET | `/api/teacher/session/:id/attendance` | Live attendance for session |
| GET | `/api/teacher/reports` | Reports for assigned subjects |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/subjects` | Enrolled subjects |
| GET | `/api/student/session/active` | Check active sessions |
| POST | `/api/student/attendance/mark` | Mark attendance (GPS + WebAuthn) |
| GET | `/api/student/attendance/my` | Own attendance history |
| GET | `/api/student/attendance/percentage` | Subject-wise percentage |
| GET | `/api/student/dashboard` | Dashboard data |

---

## 6. Frontend Design System

Ported from `attendguard-design-system.html`:

### Color Palette (Slate/Indigo Academic)
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-500` | `#4F46E5` | Primary CTA, links, active nav |
| `--brand-600` | `#4338CA` | Hover state |
| `--brand-50` | `#EEF2FF` | Active nav bg |
| `--bg` | `#F7F8FC` | Page background |
| `--surface` | `#FFFFFF` | Cards, sidebar |
| `--success` | `#16A34A` | Present badge |
| `--danger` | `#E11D48` | Absent badge |
| `--warning` | `#D97706` | Low attendance |
| `--info` | `#2563EB` | Session open |

### Typography
| Name | Font | Size |
|------|------|------|
| Display | Instrument Serif | 52px (titles), 32px (headings) |
| Body | DM Sans | 14px (body), 11px (labels) |
| Mono | DM Mono | 12px (codes, IDs, timestamps) |

### Component Library
- **Atoms:** Button (5 variants × 3 sizes), Badge (5 variants), Input/Select, Avatar, StatusDot, ProgressBar, LiveDot (animated), Spinner
- **Molecules:** StatCard, Alert (4 types), SessionRow, HistoryRow, StepItem, DataTable, PercentageRing
- **Organisms:** Sidebar (collapsible), LoginPage (split), MarkAttendanceCard, LiveSessionBanner, HODDashboard, TeacherLiveSession, StudentDashboard

---

## 7. Frontend Pages

### Login (`/login`)
- Split layout: brand panel (gradient, features) + form panel
- Role tabs: HOD / Teacher / Student
- Error alerts, loading spinner

### HOD Dashboard (`/hod`)
- Stats row: Students, Present Today, Live Sessions, Low Attendance
- Active sessions with live dot
- Recent attendance table

### HOD CRUD Pages
- `/hod/classes` — Create/delete class sections
- `/hod/subjects` — Create/delete subjects
- `/hod/teachers` — Add/delete teachers with form
- `/hod/students` — Add/delete students with form
- `/hod/mappings` — Assign teacher → class → subject (3 dropdowns)
- `/hod/enrollments` — Enroll student → class → subjects (multi-select)
- `/hod/sessions` — Open sessions (class + subject + teacher)
- `/hod/reports` — Full attendance report table

### Teacher Dashboard (`/teacher`)
- Stats: Assigned Classes, Active Sessions, Today's Sessions
- Active session list with live dots
- Assignment table

### Teacher Live Session (`/teacher/session`)
- Start session from dropdown
- Live session banner: subject, LIVE badge, present count, timer
- Stats row: Present / Absent / Rate
- Student roll table with real-time status, refresh button

### Student Dashboard (`/student`)
- **Mobile-first** layout (max-width 480px)
- Device registration banner (WebAuthn `navigator.credentials.create()`)
- Active session cards with "Mark Attendance" button
- Multi-step flow: GPS → Biometric → Success/Error
- Mini stats (Overall % + Today count)
- Recent attendance list
- Low attendance warning alert

---

## 8. Dependencies

### Backend (`package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.x | REST API framework |
| mongoose | ^8.x | MongoDB ODM |
| bcryptjs | ^2.4.x | Password hashing |
| jsonwebtoken | ^9.x | JWT auth |
| @simplewebauthn/server | ^9.x | WebAuthn server-side |
| cors | ^2.8.x | Cross-origin requests |
| dotenv | ^16.x | Environment variables |
| express-validator | ^7.x | Input validation |

### Frontend (`package.json`)
| Package | Purpose |
|---------|---------|
| react + react-dom | UI framework |
| react-router-dom | Client-side routing |
| axios | HTTP client |
| zustand | State management |
| @simplewebauthn/browser | WebAuthn browser API |

---

## 9. Environment Variables

```env
MONGO_URI=mongodb://127.0.0.1:27017/Attendguard
JWT_SECRET=your_super_secret_key_here_attendguard_2026
JWT_EXPIRES_IN=8h
PORT=5000
CAMPUS_LAT=12.961728
CAMPUS_LON=80.059083
CAMPUS_RADIUS=151.75
RP_ID=localhost
RP_NAME=AttendGuard
ORIGIN=http://localhost:5173
```

---

## 10. Build & Run Instructions

```bash
# 1. Start MongoDB
mongod

# 2. Start backend (port 5000)
cd backend
npm install          # first time only
node server.js

# 3. Start frontend (port 5173)
cd frontend
npm install          # first time only
npm run dev

# 4. Create initial HOD account (one-time setup)
# POST http://localhost:5000/api/auth/register-department
# Content-Type: application/json
# Body:
{
  "name": "Computer Science Engineering",
  "code": "CSE",
  "hodName": "Dr. Meena R.",
  "email": "hod.cse@sairamtap.edu.in",
  "password": "password123"
}

# 5. Login at http://localhost:5173/login as HOD
# 6. Create classes, subjects, teachers, students
# 7. Create mappings (teacher → class → subject)
# 8. Enroll students (student → class → subjects)
# 9. Open attendance session
# 10. Student logs in → registers biometric → marks attendance
```

---

## 11. Build Verification

| Check | Result |
|-------|--------|
| Backend files created | ✓ 8 models, 5 controllers, 5 routes, 2 middleware, 2 utils |
| Backend `npm install` | ✓ 125 packages, 0 vulnerabilities |
| Frontend `npm install` | ✓ 187 packages, 0 vulnerabilities |
| Frontend `npm run build` | ✓ 118 modules, 0 errors |
| Build output | `dist/index.html` (0.46 KB), `dist/assets/index.css` (16.97 KB), `dist/assets/index.js` (326 KB) |

---

## 12. Technical Notes

### WebAuthn Flow
1. **Registration:** `generateRegistrationOptions()` → browser `startRegistration()` → `verifyRegistrationResponse()` → save `credentialID`, `publicKey`, `counter` to `devices[]`
2. **Authentication:** `generateAuthenticationOptions()` → browser `startAuthentication()` → `verifyAuthenticationResponse()` → verify signature, increment counter

### GPS Geofencing
- Formula: `d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1)cos(lat2)sin²(Δlon/2)))`
- Earth radius: 6,371,000 meters
- Campus center: `12.961728, 80.059083`
- Allowed radius: `151.75 meters`

### JWT Strategy
- Payload: `{ userId, role, departmentId }`
- Expiry: 8 hours
- Storage: `localStorage` (via Zustand)
- Middleware: `verifyToken` → `roleGuard` chain

### Session Management
- When session opens: system pre-inserts ABSENT records for all enrolled students
- When student marks: record updates from ABSENT → PRESENT
- When session closes: `endTime` set, `status` → `closed`, no more marks accepted

---

## 13. Bug Fixes & Refinements (Post-Launch)

During testing and deployment, several edge cases were resolved to ensure robust functionality:

1. **User Schema Hook Crash:** Fixed an issue where the async `userSchema.pre('save')` hook incorrectly threw a `next is not a function` error inside Mongoose's internal `$__save` pipeline. Replaced it with the built-in `{ timestamps: true }` option.
2. **Missing Email Safeguard:** Added a `.toLowerCase()` fallback for empty emails in `hodController.js` to prevent 500 errors when administrators create users without emails.
3. **Class Model Schema Error:** Fixed a `MissingSchemaError` inside `Class.js` caused by dynamically querying `mongoose.model('Department')` before the model was fully registered. Replaced with direct requirement.
4. **401 Interceptor Refresh Loop:** Refactored `api.js` Axios interceptor to ignore `401 Unauthorized` responses specifically from `/auth/login` so the frontend correctly displays validation errors instead of forcefully reloading the page.
5. **Live Session State UI:** Updated the "Live Session" page for Teachers to automatically query the backend for existing `open` sessions on component mount, preventing the UI from dropping state if the teacher navigates away and back.
6. **HOD Session Management:** Upgraded the HOD "Sessions" page to proactively list all cross-department active sessions and added a "Close" button to manually terminate any stuck sessions.
7. **Frontend Ngrok Support:** Updated `vite.config.js` to `host: true` and explicitly allowed ngrok host headers so the frontend can be securely exposed to mobile devices for GPS testing over HTTPS.
8. **Mobile API Connectivity:** Changed `baseURL` in `frontend/src/utils/api.js` from `localhost:5000` to a relative `/api` path. This ensures that mobile devices connected via ngrok route API calls back to the server correctly instead of looking for the server on their own localhost.
9. **WebAuthn Strict Origin:** Fixed a mobile registration error by aligning `.env` `ORIGIN` and `RP_ID` precisely with the ngrok domain. This is a strict requirement for FIDO2/WebAuthn cryptographic validation.
10. **Enhanced WebAuthn Reliability:** Refactored `webauthnController.js` with manual base64url decoding and `userVerification: required` to increase success rates on mobile browsers.
11. **Cryptographic Error Transparency:** Modified backend controllers to return explicit WebAuthn error messages to the frontend, replacing generic "Server Error" logs for faster troubleshooting.
12. **Biometric Data Reset:** Performed a database-wide reset of student `devices[]` to ensure all handsets started with fresh, compatible passkeys under the new ngrok domain.
13. **WebAuthn Version Compatibility (Root Cause Found):** The previous working project used `@simplewebauthn/server` **v9**, but this project had **v13.2.3** installed. The API changed significantly between these versions:
    - **v9:** `registrationInfo.credentialID` (Buffer), `registrationInfo.credentialPublicKey` (Buffer), `authenticator: { ... }` for auth verify.
    - **v13:** `registrationInfo.credential.id` (base64url string), `registrationInfo.credential.publicKey` (Uint8Array), `credential: { ... }` for auth verify.
    - This mismatch caused `Buffer.from(undefined)` and `input.replace is not a function` crashes. Resolved by reading the actual v13 library source code and rewriting `webauthnController.js` to use the correct v13 data structures. Passkey creation and biometric authentication now work correctly on mobile devices over ngrok. ✅

---

*AttendGuard — Built by NAVEENKUMAR T · Sri Sairam Engineering College · March 2026*
