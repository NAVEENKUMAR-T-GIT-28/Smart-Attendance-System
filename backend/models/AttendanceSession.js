const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedBy: { type: String, required: true, enum: ['teacher', 'hod'] },
    date: { type: Date, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open' },
    createdAt: { type: Date, default: Date.now }
});

// One session per subject per class per day
attendanceSessionSchema.index({ classId: 1, subjectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
