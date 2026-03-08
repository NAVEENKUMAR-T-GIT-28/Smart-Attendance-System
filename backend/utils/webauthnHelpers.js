const crypto = require('crypto');

/**
 * Generate a random challenge for WebAuthn
 */
const generateChallenge = () => {
    return crypto.randomBytes(32).toString('base64url');
};

/**
 * Get WebAuthn Relying Party config from env
 */
const getRPConfig = () => ({
    rpName: process.env.RP_NAME || 'AttendGuard',
    rpID: process.env.RP_ID || 'localhost',
    origin: process.env.ORIGIN || 'http://localhost:5173'
});

module.exports = { generateChallenge, getRPConfig };
