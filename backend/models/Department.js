const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    hodName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Department', departmentSchema);
