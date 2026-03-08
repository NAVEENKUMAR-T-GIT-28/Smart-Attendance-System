const mongoose = require('mongoose');

const studentClassSubjectSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    createdAt: { type: Date, default: Date.now }
});

studentClassSubjectSchema.index({ studentId: 1, classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('StudentClassSubject', studentClassSubjectSchema);
