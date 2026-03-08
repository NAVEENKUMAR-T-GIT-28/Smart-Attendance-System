const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true },
    status: { type: String, required: true, enum: ['present', 'absent'], default: 'absent' },
    markedAt: { type: Date },
    gpsVerified: { type: Boolean, default: false },
    biometricVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate attendance in same session
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
