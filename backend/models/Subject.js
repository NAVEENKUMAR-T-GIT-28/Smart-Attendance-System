const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    createdAt: { type: Date, default: Date.now }
});

// Unique code per department
subjectSchema.index({ departmentId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
