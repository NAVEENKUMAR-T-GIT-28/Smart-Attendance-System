const bcrypt = require('bcryptjs');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const TeacherClassSubject = require('../models/TeacherClassSubject');
const StudentClassSubject = require('../models/StudentClassSubject');
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');

// ─── CLASSES ────────────────────────────────────────────────
const createClass = async (req, res) => {
    try {
        const { year, section } = req.body;
        const departmentId = req.user.departmentId;
        const cls = await Class.create({ departmentId, year, section });
        res.status(201).json(cls);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Class already exists.' });
        res.status(500).json({ message: 'Server error.' });
    }
};

const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({ departmentId: req.user.departmentId }).sort({ year: 1, section: 1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteClass = async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.id);
        res.json({ message: 'Class deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── SUBJECTS ────────────────────────────────────────────────
const createSubject = async (req, res) => {
    try {
        const { name, code } = req.body;
        const departmentId = req.user.departmentId;
        const subject = await Subject.create({ departmentId, name, code });
        res.status(201).json(subject);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Subject code already exists in this department.' });
        res.status(500).json({ message: 'Server error.' });
    }
};

const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ departmentId: req.user.departmentId }).sort({ code: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── USERS (Teachers + Students) ─────────────────────────────
const addUser = async (req, res) => {
    try {
        const { name, email, password, role, registerNumber, staffId } = req.body;
        const departmentId = req.user.departmentId;

        const hashedPassword = await bcrypt.hash(password, 10);
        const safeEmail = email ? String(email).toLowerCase() : '';
        const user = await User.create({
            departmentId, name, email: safeEmail, password: hashedPassword,
            role, registerNumber, staffId
        });

        res.status(201).json({
            id: user._id, name: user.name, email: user.email,
            role: user.role, registerNumber: user.registerNumber, staffId: user.staffId
        });
    } catch (error) {
        console.error('Add user error:', error);
        if (error.code === 11000) return res.status(400).json({ message: 'Email already exists.' });
        res.status(500).json({ message: 'Server error.' });
    }
};

const getUsers = async (req, res) => {
    try {
        const query = { departmentId: req.user.departmentId };
        if (req.query.role) query.role = req.query.role;
        const users = await User.find(query).select('-password -currentChallenge -devices').sort({ name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, registerNumber, staffId } = req.body;
        const update = {};
        if (name) update.name = name;
        if (email) update.email = email.toLowerCase();
        if (registerNumber) update.registerNumber = registerNumber;
        if (staffId) update.staffId = staffId;

        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -currentChallenge -devices');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── MAPPINGS (Teacher → Class → Subject) ────────────────────
const createMapping = async (req, res) => {
    try {
        const { teacherId, classId, subjectId } = req.body;
        const departmentId = req.user.departmentId;
        const mapping = await TeacherClassSubject.create({ teacherId, classId, subjectId, departmentId });
        res.status(201).json(mapping);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Mapping already exists.' });
        res.status(500).json({ message: 'Server error.' });
    }
};

const getMappings = async (req, res) => {
    try {
        const mappings = await TeacherClassSubject.find({ departmentId: req.user.departmentId })
            .populate('teacherId', 'name email staffId')
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');
        res.json(mappings);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteMapping = async (req, res) => {
    try {
        await TeacherClassSubject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Mapping deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── ENROLLMENTS (Student → Class → Subject) ─────────────────
const createEnrollment = async (req, res) => {
    try {
        const { studentId, classId, subjectIds } = req.body;
        const departmentId = req.user.departmentId;

        const enrollments = [];
        for (const subjectId of subjectIds) {
            try {
                const enrollment = await StudentClassSubject.create({ studentId, classId, subjectId, departmentId });
                enrollments.push(enrollment);
            } catch (e) {
                if (e.code !== 11000) throw e; // skip duplicates
            }
        }
        res.status(201).json({ message: `${enrollments.length} enrollment(s) created.`, enrollments });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getEnrollments = async (req, res) => {
    try {
        const query = { departmentId: req.user.departmentId };
        if (req.query.classId) query.classId = req.query.classId;
        if (req.query.studentId) query.studentId = req.query.studentId;

        const enrollments = await StudentClassSubject.find(query)
            .populate('studentId', 'name email registerNumber')
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteEnrollment = async (req, res) => {
    try {
        await StudentClassSubject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Enrollment deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── SESSIONS ────────────────────────────────────────────────
const startSession = async (req, res) => {
    try {
        const { classId, subjectId, teacherId } = req.body;
        const departmentId = req.user.departmentId;

        // Date only (no time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const session = await AttendanceSession.create({
            departmentId, classId, subjectId,
            teacherId: teacherId || req.user.userId,
            startedBy: 'hod',
            date: today,
            startTime: new Date(),
            status: 'open'
        });

        // Pre-insert ABSENT records for all enrolled students
        const enrollments = await StudentClassSubject.find({ classId, subjectId, departmentId });
        const attendanceRecords = enrollments.map(e => ({
            sessionId: session._id,
            studentId: e.studentId,
            classId, subjectId, departmentId,
            date: today,
            status: 'absent'
        }));

        if (attendanceRecords.length > 0) {
            await Attendance.insertMany(attendanceRecords);
        }

        res.status(201).json({ session, studentsEnrolled: attendanceRecords.length });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Session already exists for this class/subject today.' });
        console.error('Start session error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const closeSession = async (req, res) => {
    try {
        const session = await AttendanceSession.findByIdAndUpdate(
            req.params.id,
            { status: 'closed', endTime: new Date() },
            { new: true }
        );
        if (!session) return res.status(404).json({ message: 'Session not found.' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── REPORTS ─────────────────────────────────────────────────
const getAttendanceReport = async (req, res) => {
    try {
        const departmentId = req.user.departmentId;
        const { classId, subjectId, date } = req.query;

        const match = { departmentId: departmentId };
        if (classId) match.classId = classId;
        if (subjectId) match.subjectId = subjectId;
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            match.date = d;
        }

        const records = await Attendance.find(match)
            .populate('studentId', 'name email registerNumber')
            .populate('subjectId', 'name code')
            .populate('classId', 'label year section')
            .populate('sessionId', 'startTime endTime status')
            .sort({ date: -1, subjectId: 1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const departmentId = req.user.departmentId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalStudents, totalTeachers, totalClasses, todaySessions, todayAttendance, lowAttendanceStudents] = await Promise.all([
            User.countDocuments({ departmentId, role: 'student' }),
            User.countDocuments({ departmentId, role: 'teacher' }),
            Class.countDocuments({ departmentId }),
            AttendanceSession.find({ departmentId, date: today }).populate('classId', 'label year section').populate('subjectId', 'name code').populate('teacherId', 'name'),
            Attendance.find({ departmentId, date: today }),
            // Aggregate low attendance
            Attendance.aggregate([
                { $match: { departmentId: departmentId } },
                { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
                { $addFields: { percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
                { $match: { percentage: { $lt: 75 } } },
                { $count: 'count' }
            ])
        ]);

        const presentToday = todayAttendance.filter(a => a.status === 'present').length;
        const liveSessions = todaySessions.filter(s => s.status === 'open');

        res.json({
            totalStudents,
            totalTeachers,
            totalClasses,
            presentToday,
            totalToday: todayAttendance.length,
            liveSessions: liveSessions.length,
            liveSessionDetails: liveSessions,
            lowAttendanceCount: lowAttendanceStudents[0]?.count || 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    createClass, getClasses, deleteClass,
    createSubject, getSubjects, deleteSubject,
    addUser, getUsers, updateUser, deleteUser,
    createMapping, getMappings, deleteMapping,
    createEnrollment, getEnrollments, deleteEnrollment,
    startSession, closeSession,
    getAttendanceReport, getDashboardStats
};
