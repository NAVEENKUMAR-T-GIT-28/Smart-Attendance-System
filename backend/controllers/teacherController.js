const TeacherClassSubject = require('../models/TeacherClassSubject');
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const StudentClassSubject = require('../models/StudentClassSubject');

// GET /api/teacher/classes — get assigned classes + subjects
const getAssignedClasses = async (req, res) => {
    try {
        const mappings = await TeacherClassSubject.find({ teacherId: req.user.userId })
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');
        res.json(mappings);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// POST /api/teacher/session/start
const startSession = async (req, res) => {
    try {
        const { classId, subjectId } = req.body;
        const teacherId = req.user.userId;
        const departmentId = req.user.departmentId;

        // Verify teacher is mapped to this class+subject
        const mapping = await TeacherClassSubject.findOne({ teacherId, classId, subjectId });
        if (!mapping) return res.status(403).json({ message: 'You are not assigned to this class/subject.' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const session = await AttendanceSession.create({
            departmentId, classId, subjectId, teacherId,
            startedBy: 'teacher', date: today, startTime: new Date(), status: 'open'
        });

        // Pre-insert ABSENT records
        const enrollments = await StudentClassSubject.find({ classId, subjectId, departmentId });
        const records = enrollments.map(e => ({
            sessionId: session._id, studentId: e.studentId,
            classId, subjectId, departmentId, date: today, status: 'absent'
        }));

        if (records.length > 0) await Attendance.insertMany(records);

        res.status(201).json({ session, studentsEnrolled: records.length });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Session already exists for today.' });
        console.error('Teacher start session error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// PUT /api/teacher/session/:id/close
const closeSession = async (req, res) => {
    try {
        const session = await AttendanceSession.findOne({ _id: req.params.id, teacherId: req.user.userId });
        if (!session) return res.status(404).json({ message: 'Session not found or not yours.' });

        session.status = 'closed';
        session.endTime = new Date();
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/teacher/session/:id/attendance
const getSessionAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ sessionId: req.params.id })
            .populate('studentId', 'name email registerNumber')
            .sort({ status: 1, 'studentId.name': 1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/teacher/reports
const getReports = async (req, res) => {
    try {
        const mappings = await TeacherClassSubject.find({ teacherId: req.user.userId });
        const reports = [];

        for (const m of mappings) {
            const total = await Attendance.countDocuments({ classId: m.classId, subjectId: m.subjectId });
            const present = await Attendance.countDocuments({ classId: m.classId, subjectId: m.subjectId, status: 'present' });
            const sessions = await AttendanceSession.countDocuments({ classId: m.classId, subjectId: m.subjectId });

            reports.push({
                classId: m.classId,
                subjectId: m.subjectId,
                totalRecords: total,
                presentRecords: present,
                percentage: total > 0 ? Math.round((present / total) * 100) : 0,
                totalSessions: sessions
            });
        }

        // Populate class/subject info
        const populated = await TeacherClassSubject.populate(reports, [
            { path: 'classId', select: 'label year section' },
            { path: 'subjectId', select: 'name code' }
        ]);

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/teacher/dashboard
const getDashboard = async (req, res) => {
    try {
        const teacherId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mappings = await TeacherClassSubject.find({ teacherId })
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');

        const activeSessions = await AttendanceSession.find({
            teacherId, status: 'open', date: today
        }).populate('classId', 'label year section').populate('subjectId', 'name code');

        const todaySessions = await AttendanceSession.find({
            teacherId, date: today
        });

        res.json({
            assignedClasses: mappings.length,
            activeSessions,
            todaySessionCount: todaySessions.length,
            mappings
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getAssignedClasses, startSession, closeSession, getSessionAttendance, getReports, getDashboard };
