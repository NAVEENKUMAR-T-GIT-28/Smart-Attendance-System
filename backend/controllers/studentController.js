const StudentClassSubject = require('../models/StudentClassSubject');
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { isWithinCampus } = require('../utils/haversine');
const {
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { getRPConfig } = require('../utils/webauthnHelpers');

// GET /api/student/subjects
const getSubjects = async (req, res) => {
    try {
        const enrollments = await StudentClassSubject.find({ studentId: req.user.userId })
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/student/session/active
const getActiveSessions = async (req, res) => {
    try {
        const enrollments = await StudentClassSubject.find({ studentId: req.user.userId });
        const classSubjectPairs = enrollments.map(e => ({
            classId: e.classId, subjectId: e.subjectId
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessions = await AttendanceSession.find({
            status: 'open', date: today,
            $or: classSubjectPairs.length > 0 ? classSubjectPairs : [{ classId: null }]
        })
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code')
            .populate('teacherId', 'name');

        // Check which ones student has already marked
        const sessionsWithStatus = await Promise.all(sessions.map(async (s) => {
            const attendance = await Attendance.findOne({
                sessionId: s._id, studentId: req.user.userId
            });
            return {
                ...s.toObject(),
                alreadyMarked: attendance?.status === 'present',
                attendanceId: attendance?._id
            };
        }));

        res.json(sessionsWithStatus);
    } catch (error) {
        console.error('Active sessions error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// POST /api/student/attendance/mark
const markAttendance = async (req, res) => {
    try {
        const { sessionId, latitude, longitude, webauthnResponse } = req.body;
        const studentId = req.user.userId;

        // 1. Session check
        const session = await AttendanceSession.findById(sessionId);
        if (!session || session.status !== 'open') {
            return res.status(400).json({ message: 'Session is not open.', step: 'session' });
        }

        // Check enrollment
        const enrollment = await StudentClassSubject.findOne({
            studentId, classId: session.classId, subjectId: session.subjectId
        });
        if (!enrollment) {
            return res.status(403).json({ message: 'You are not enrolled in this subject.', step: 'enrollment' });
        }

        // Check if already marked present
        const existingRecord = await Attendance.findOne({ sessionId, studentId });
        if (existingRecord && existingRecord.status === 'present') {
            return res.status(400).json({ message: 'Attendance already marked.', step: 'duplicate' });
        }

        // 2. GPS check
        const gpsResult = isWithinCampus(latitude, longitude);
        if (!gpsResult.withinCampus) {
            return res.status(400).json({
                message: `You are ${gpsResult.distance}m from campus. Must be within ${process.env.CAMPUS_RADIUS}m.`,
                step: 'gps', distance: gpsResult.distance
            });
        }

        // 3. WebAuthn biometric verification
        const user = await User.findById(studentId);
        if (!user || !user.devices || user.devices.length === 0) {
            return res.status(400).json({ message: 'No biometric device registered.', step: 'biometric' });
        }

        const { rpID, origin } = getRPConfig();
        const credentialID = webauthnResponse.id;
        const device = user.devices.find(d => d.credentialID === credentialID);
        if (!device) {
            return res.status(400).json({ message: 'Device not recognized.', step: 'biometric' });
        }

        const verification = await verifyAuthenticationResponse({
            response: webauthnResponse,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: device.credentialID,
                publicKey: Uint8Array.from(Buffer.from(device.credentialPublicKey, 'base64url')),
                counter: device.counter,
                transports: device.transports,
            },
        });

        if (!verification.verified) {
            return res.status(400).json({ message: 'Biometric verification failed.', step: 'biometric' });
        }

        // Update counter
        device.counter = verification.authenticationInfo.newCounter;
        user.currentChallenge = undefined;
        await user.save();

        // 4. Update attendance record from ABSENT → PRESENT
        const attendance = await Attendance.findOneAndUpdate(
            { sessionId, studentId },
            {
                status: 'present',
                markedAt: new Date(),
                gpsVerified: true,
                biometricVerified: true
            },
            { new: true }
        );

        res.json({
            message: 'Attendance marked successfully!',
            attendance,
            distance: gpsResult.distance
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/student/attendance/my
const getMyAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.user.userId })
            .populate('subjectId', 'name code')
            .populate('classId', 'label year section')
            .populate('sessionId', 'startTime endTime')
            .sort({ date: -1 })
            .limit(50);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/student/attendance/percentage
const getPercentage = async (req, res) => {
    try {
        const enrollments = await StudentClassSubject.find({ studentId: req.user.userId })
            .populate('subjectId', 'name code')
            .populate('classId', 'label');

        const stats = await Promise.all(enrollments.map(async (e) => {
            const total = await Attendance.countDocuments({
                studentId: req.user.userId, subjectId: e.subjectId._id
            });
            const present = await Attendance.countDocuments({
                studentId: req.user.userId, subjectId: e.subjectId._id, status: 'present'
            });

            return {
                subject: e.subjectId,
                class: e.classId,
                total,
                present,
                absent: total - present,
                percentage: total > 0 ? Math.round((present / total) * 100) : 0
            };
        }));

        // Overall
        const totalAll = stats.reduce((a, s) => a + s.total, 0);
        const presentAll = stats.reduce((a, s) => a + s.present, 0);

        res.json({
            subjects: stats,
            overall: {
                total: totalAll,
                present: presentAll,
                percentage: totalAll > 0 ? Math.round((presentAll / totalAll) * 100) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/student/dashboard
const getDashboard = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const user = await User.findById(studentId).select('name devices');

        // Get enrolled subjects
        const enrollments = await StudentClassSubject.find({ studentId })
            .populate('classId', 'label year section')
            .populate('subjectId', 'name code');

        // Get active sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const classSubjectPairs = enrollments.map(e => ({
            classId: e.classId._id, subjectId: e.subjectId._id
        }));

        let activeSessions = [];
        if (classSubjectPairs.length > 0) {
            activeSessions = await AttendanceSession.find({
                status: 'open', date: today,
                $or: classSubjectPairs
            }).populate('classId', 'label year section').populate('subjectId', 'name code').populate('teacherId', 'name');
        }

        // Recent attendance
        const recentAttendance = await Attendance.find({ studentId })
            .populate('subjectId', 'name code')
            .sort({ date: -1 })
            .limit(5);

        // Overall stats
        const totalRecords = await Attendance.countDocuments({ studentId });
        const presentRecords = await Attendance.countDocuments({ studentId, status: 'present' });
        const todayRecords = await Attendance.countDocuments({ studentId, date: today, status: 'present' });

        res.json({
            name: user?.name,
            hasDevice: user?.devices?.length > 0,
            enrolledSubjects: enrollments.length,
            activeSessions,
            recentAttendance,
            overall: {
                total: totalRecords,
                present: presentRecords,
                percentage: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
            },
            todayPresent: todayRecords
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getSubjects, getActiveSessions, markAttendance, getMyAttendance, getPercentage, getDashboard };
