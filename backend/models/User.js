const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['teacher', 'student'] },
    registerNumber: { type: String, sparse: true },
    staffId: { type: String, sparse: true },
    currentChallenge: { type: String },
    devices: [{
        credentialID: { type: String, required: true },
        credentialPublicKey: { type: String, required: true },
        counter: { type: Number, required: true, default: 0 },
        transports: [String]
    }],
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
