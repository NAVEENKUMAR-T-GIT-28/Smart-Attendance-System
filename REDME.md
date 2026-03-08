AttendGuard
Smart Web-Based Attendance System
Full Project Blueprint — DB + Backend + Build Plan
Author: NAVEENKUMAR T  |  Stack: MERN + WebAuthn + GPS

1. Project Overview
AttendGuard is a secure, hardware-free attendance management platform for colleges. Students mark attendance using device biometrics (WebAuthn — fingerprint / Face ID) verified by GPS geofencing — all from a standard web browser.
This document covers the complete backend architecture, database schema, API design, and build sequence for the MVP.

Dimension	Detail
Project Type	Full-Stack Web Application (MVP)
Stack	MongoDB · Express.js · React · Node.js
Auth Method	JWT + WebAuthn (FIDO2)
Location Method	GPS Geofencing (Haversine formula)
Campus GPS	Lat 12.961728 · Lon 80.059083 · Radius 151.75 m
Author	NAVEENKUMAR T
College	Sri Sairam Engineering College

2. System Design — 3-Level Architecture
2.1 Role Hierarchy
The system has three roles with strictly defined responsibilities:

Role	Who	Key Powers
Department (HOD)	Head of Department	Create classes, add teachers & students, create subjects, map teacher→class→subject, view all reports, start attendance
Teacher	Subject Faculty	View assigned classes & subjects, start/close attendance session for their subject, mark students present
Student	Hostel Resident	Login, register biometric device, mark attendance via WebAuthn + GPS, view own attendance history

2.2 Authority Flow
HOD creates everything top-down. No super admin needed — the Department login IS the admin for its scope.
Department (HOD Login)
    └─ Creates Classes (Year + Section)
    └─ Creates Subjects
    └─ Adds Teachers → maps Teacher : Class : Subject
    └─ Adds Students → enrolls Student : Class : Subjects

Teacher
    └─ Sees only their mapped Classes + Subjects
    └─ Opens attendance session → Students mark attendance

Student
    └─ Sees only enrolled subjects
    └─ Marks attendance via WebAuthn + GPS check

2.3 Attendance Flow
The complete end-to-end attendance marking sequence:

Step	Actor	Action
1	HOD	Creates class, subject, teacher mapping, student enrollment
2	Teacher / HOD	Opens attendance session for a subject + class
3	System	Pre-inserts ABSENT records for all enrolled students in that session
4	Student	Opens app → clicks Mark Attendance
5	Browser	Fetches GPS coordinates
6	Backend	Validates GPS is within campus radius (Haversine)
7	Browser	Triggers WebAuthn fingerprint / Face ID prompt
8	Backend	Verifies WebAuthn assertion against stored credential
9	System	Updates student record from ABSENT → PRESENT
10	Teacher / HOD	Closes session → no more marks accepted

3. Database Schema (MongoDB)
3.1 Collections Overview
Collection	Purpose	Key Relations
departments	HOD login + dept info	Root — owns all other data
classes	Year + Section per dept	→ departments
subjects	Subject master per dept	→ departments
users	Teachers + Students (role field)	→ departments
teacher_class_subjects	Teacher : Class : Subject mapping	→ users, classes, subjects
student_class_subjects	Student enrollment per subject	→ users, classes, subjects
attendance_sessions	One session per subject per class per day	→ classes, subjects, users
attendance	Individual student attendance record	→ sessions, users

3.2 departments
The top-level entity. One document per department. HOD logs in with this account.
{
  _id          : ObjectId,
  name         : String,   // 'Computer Science Engineering'
  code         : String,   // 'CSE' (unique)
  hodName      : String,
  email        : String,   // login credential (unique)
  password     : String,   // bcrypt hashed
  createdAt    : Date
}

3.3 classes
Each class belongs to a department. Uniqueness enforced on dept + year + section.
{
  _id           : ObjectId,
  departmentId  : ObjectId,  // ref: departments
  year          : Number,    // 1 | 2 | 3 | 4
  section       : String,    // 'A' | 'B' | 'C'
  label         : String,    // auto: 'CSE Year 2 - Section A'
  createdAt     : Date
}
Index: { departmentId, year, section } → unique

3.4 subjects
Subjects are owned by a department, not locked to a class. Assignment is done in the mapping collection.
{
  _id           : ObjectId,
  departmentId  : ObjectId,  // ref: departments
  name          : String,    // 'Data Structures & Algorithms'
  code          : String,    // 'CS301' (unique per dept)
  createdAt     : Date
}

3.5 users  (Teachers + Students)
Single collection for both roles. The role field separates behavior. WebAuthn credentials stored in the devices array — matching your existing MongoDB document structure.
{
  _id              : ObjectId,
  departmentId     : ObjectId,  // ref: departments
  name             : String,
  email            : String,    // unique
  password         : String,    // bcrypt
  role             : String,    // enum: ['teacher', 'student']
  registerNumber   : String,    // students only (unique)
  staffId          : String,    // teachers only (unique)
  currentChallenge : String,    // WebAuthn challenge (temp)
  devices: [{                   // WebAuthn credentials array
    credentialID       : String,
    credentialPublicKey: String,
    counter            : Number,
    transports         : [String]
  }],
  createdAt  : Date,
  updatedAt  : Date
}

3.6 teacher_class_subjects  (KEY MAPPING TABLE)
This single collection handles the many-to-many relationship: one teacher → many classes → many subjects. HOD creates these mappings.
{
  _id           : ObjectId,
  teacherId     : ObjectId,  // ref: users (role: teacher)
  classId       : ObjectId,  // ref: classes
  subjectId     : ObjectId,  // ref: subjects
  departmentId  : ObjectId,  // ref: departments
  createdAt     : Date
}
Index: { teacherId, classId, subjectId } → unique

3.7 student_class_subjects  (ENROLLMENT TABLE)
Tracks which subjects a student is enrolled in. Attendance is only allowed for enrolled subjects.
{
  _id           : ObjectId,
  studentId     : ObjectId,  // ref: users (role: student)
  classId       : ObjectId,  // ref: classes
  subjectId     : ObjectId,  // ref: subjects
  departmentId  : ObjectId,
  createdAt     : Date
}
Index: { studentId, classId, subjectId } → unique

3.8 attendance_sessions
One session per subject per class per day. Either teacher or HOD can open it. Default records are pre-inserted when session opens.
{
  _id           : ObjectId,
  departmentId  : ObjectId,
  classId       : ObjectId,  // ref: classes
  subjectId     : ObjectId,  // ref: subjects
  teacherId     : ObjectId,  // who opened it
  startedBy     : String,    // enum: ['teacher', 'hod']
  date          : Date,      // date only (no time)
  startTime     : Date,
  endTime       : Date,      // set on close
  status        : String,    // enum: ['open', 'closed']
  createdAt     : Date
}
Index: { classId, subjectId, date } → unique
// Prevents duplicate sessions for same subject+class on same day

3.9 attendance
Individual student attendance records. Default status is ABSENT. Pre-inserted for all enrolled students when session opens. Student marking triggers GPS + WebAuthn check, then updates to PRESENT.
{
  _id           : ObjectId,
  sessionId     : ObjectId,  // ref: attendance_sessions
  studentId     : ObjectId,  // ref: users
  classId       : ObjectId,
  subjectId     : ObjectId,
  departmentId  : ObjectId,
  date          : Date,
  status        : String,    // enum: ['present', 'absent'] — DEFAULT: 'absent'
  markedAt      : Date,      // timestamp when marked present
  gpsVerified   : Boolean,   // was GPS check passed
  biometricVerified: Boolean,// was WebAuthn check passed
  createdAt     : Date
}
Index: { sessionId, studentId } → unique
// Prevents a student marking attendance twice in same session

4. API Endpoints
4.1 Auth — All Roles
Method	Endpoint	Who	Description
POST	/api/auth/login	All	Login — returns JWT. Role determines dashboard

4.2 WebAuthn — Students
Method	Endpoint	Description
POST	/api/webauthn/register-options	Get challenge to start device registration
POST	/api/webauthn/register-verify	Verify & save credential (credentialID, publicKey, counter)
POST	/api/webauthn/auth-options	Get challenge to start authentication
POST	/api/webauthn/auth-verify	Verify assertion → returns attendance token

4.3 HOD Routes
Method	Endpoint	Description
POST	/api/hod/classes	Create new class (year + section)
GET	/api/hod/classes	List all classes in dept
POST	/api/hod/subjects	Create new subject
GET	/api/hod/subjects	List all subjects
POST	/api/hod/users	Add teacher or student (role in body)
GET	/api/hod/users	List all users (filterable by role)
PUT	/api/hod/users/:id	Update user details
DELETE	/api/hod/users/:id	Remove user
POST	/api/hod/mappings	Assign teacher → class → subject
GET	/api/hod/mappings	View all mappings
POST	/api/hod/enrollments	Enroll student → class → subjects
GET	/api/hod/attendance/report	Full dept attendance report (filterable)
POST	/api/hod/session/start	Open attendance session
PUT	/api/hod/session/:id/close	Close session

4.4 Teacher Routes
Method	Endpoint	Description
GET	/api/teacher/classes	Get assigned classes + subjects
POST	/api/teacher/session/start	Open attendance session for their subject
PUT	/api/teacher/session/:id/close	Close session
GET	/api/teacher/session/:id/attendance	View live attendance for session
GET	/api/teacher/reports	Attendance reports for their subjects

4.5 Student Routes
Method	Endpoint	Description
GET	/api/student/subjects	Get enrolled subjects
GET	/api/student/session/active	Check if a session is open for their class+subject
POST	/api/student/attendance/mark	Mark attendance (GPS + WebAuthn verified)
GET	/api/student/attendance/my	Own attendance history
GET	/api/student/attendance/percentage	Subject-wise attendance %

5. Security Architecture
5.1 Multi-Layer Verification for Attendance
Every attendance mark request passes through ALL four layers sequentially. Any failure aborts the process.

Layer	Method	What it Prevents
1 — Session Check	Validate sessionId is open + student is enrolled	Marking outside class time
2 — GPS Geofence	Haversine distance ≤ 151.75 m from campus center	Marking from hostel / home
3 — WebAuthn Biometric	Verify assertion signature with stored public key	Proxy attendance, credential sharing
4 — Duplicate Guard	Unique index on { sessionId, studentId }	Marking attendance twice

5.2 WebAuthn Key Details
•	Fingerprint/Face data NEVER leaves the device
•	Only a cryptographic assertion (signature) is sent to the server
•	Server verifies signature using stored public key — no biometric stored in DB
•	Counter increments each use — replay attacks are impossible
•	Challenge is single-use, stored as currentChallenge in user document
•	Requires HTTPS in production (WebAuthn spec requirement)

5.3 GPS Geofencing
Haversine formula calculates great-circle distance between student GPS and campus center. Accuracy metadata from browser is also logged.
Campus Center: 12.961728, 80.059083
Allowed Radius: 151.75 meters
Earth Radius used: 6,371,000 meters
Formula: d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1)cos(lat2)sin²(Δlon/2)))

5.4 JWT Strategy
Token Field	Value
Payload	userId, role, departmentId
Expiry	8 hours (configurable via env)
Storage	HttpOnly cookie recommended for production
Middleware	verifyToken → extracts role → route guard checks role

6. Backend Folder Structure
backend/
├── config/
│   └── db.js               # MongoDB Atlas connection
│
├── models/
│   ├── Department.js
│   ├── Class.js
│   ├── Subject.js
│   ├── User.js             # teachers + students (role field)
│   ├── TeacherClassSubject.js  # mapping table
│   ├── StudentClassSubject.js  # enrollment table
│   ├── AttendanceSession.js
│   └── Attendance.js
│
├── controllers/
│   ├── authController.js
│   ├── webauthnController.js
│   ├── hodController.js
│   ├── teacherController.js
│   └── studentController.js
│
├── routes/
│   ├── auth.js
│   ├── webauthn.js
│   ├── hod.js
│   ├── teacher.js
│   └── student.js
│
├── middleware/
│   ├── verifyToken.js      # JWT validation
│   └── roleGuard.js        # role-based access
│
├── utils/
│   ├── haversine.js        # GPS distance calculation
│   └── webauthnHelpers.js  # challenge generation etc.
│
├── .env
└── server.js

7. Build Sequence (Recommended Order)
Build in this exact order — each phase depends on the previous. Do not skip phases.

Phase	Task	Files / Details
Phase 1	Project Setup	npm init, install deps, .env, server.js, MongoDB connect
Phase 2	All Mongoose Models	All 8 models with indexes — build ALL before any controller
Phase 3	Auth — Department Login	POST /api/auth/login — JWT returned with role
Phase 4	HOD CRUD	Classes, Subjects, Users (add teacher/student), Mappings, Enrollments
Phase 5	WebAuthn Registration	register-options + register-verify — test with your existing credential
Phase 6	WebAuthn Authentication	auth-options + auth-verify — verify counter increment
Phase 7	Session Management	Open/close attendance sessions — pre-insert ABSENT records on open
Phase 8	Attendance Mark Flow	GPS check → WebAuthn verify → update ABSENT→PRESENT
Phase 9	Teacher Routes	View mappings, open/close own sessions, view reports
Phase 10	Reports & Percentage	Aggregate queries for attendance % per subject per student

8. Dependencies
8.1 Backend npm packages
Package	Version	Purpose
express	^4.18.x	REST API framework
mongoose	^8.x	MongoDB ODM
bcryptjs	^2.4.x	Password hashing
jsonwebtoken	^9.x	JWT auth
@simplewebauthn/server	^9.x	WebAuthn server-side verification
cors	^2.8.x	Cross-origin requests
dotenv	^16.x	Environment variables
express-validator	^7.x	Input validation

8.2 Frontend npm packages (for discussion phase)
Package	Purpose
@simplewebauthn/browser	WebAuthn browser-side API wrapper
axios	HTTP client for API calls
react-router-dom	Client-side routing
zustand	Lightweight state management

9. Environment Variables
MONGO_URI=mongodb://127.0.0.1:27017/Attendguard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=8h
PORT=5000
CAMPUS_LAT=12.961728
CAMPUS_LON=80.059083
CAMPUS_RADIUS=151.75
RP_ID=localhost              # WebAuthn Relying Party ID
RP_NAME=AttendGuard
ORIGIN=http://localhost:5173 # Frontend URL

10. What's Next — Frontend Discussion
Once the backend is built and tested, the frontend will be discussed separately. The planned pages are:

Role	Pages
HOD / Department	Login · Dashboard · Manage Classes · Manage Subjects · Add Teachers · Add Students · Mappings · Enrollment · Reports
Teacher	Login · Dashboard · My Classes · Open/Close Session · Live Attendance · Reports
Student	Login · Dashboard · My Subjects · Mark Attendance (WebAuthn + GPS) · Attendance History · Percentage View

AttendGuard — Built by NAVEENKUMAR T · Sri Sairam Engineering College
