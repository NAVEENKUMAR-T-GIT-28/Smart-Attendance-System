const mongoose = require('mongoose');
const Department = require('./Department');

const classSchema = new mongoose.Schema({
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    year: { type: Number, required: true, enum: [1, 2, 3, 4] },
    section: { type: String, required: true, uppercase: true },
    label: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate label before save
classSchema.pre('save', async function () {
    if (this.isNew || this.isModified('year') || this.isModified('section')) {
        const dept = await Department.findById(this.departmentId);
        this.label = `${dept ? dept.code : ''} Year ${this.year} - Section ${this.section}`;
    }
});

// Compound unique index
classSchema.index({ departmentId: 1, year: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
