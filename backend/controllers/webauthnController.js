const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const User = require('../models/User');
const { getRPConfig } = require('../utils/webauthnHelpers');

// Helper to convert base64url string to Uint8Array
function base64urlToUint8Array(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = Buffer.from(base64 + pad, 'base64');
    return new Uint8Array(binary);
}

// REGISTER OPTIONS
const registerOptions = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.devices.length > 0) {
            return res.status(400).json({
                message: 'Device already registered. Contact HOD to reset.'
            });
        }

        const { rpName, rpID } = getRPConfig();

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: new TextEncoder().encode(user._id.toString()),
            userName: user.email,
            userDisplayName: user.name,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'discouraged',
                userVerification: 'required',
            },
            excludeCredentials: user.devices.map(device => ({
                id: device.credentialID,
                type: 'public-key',
                transports: device.transports,
            })),
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.json(options);

    } catch (error) {
        console.error("Register options error:", error);
        res.status(500).json({ message: error.message });
    }
};


// REGISTER VERIFY
const registerVerify = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const { rpID, origin } = getRPConfig();

        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return res.status(400).json({ verified: false });
        }

        // @simplewebauthn/server v13 structure:
        //   registrationInfo.credential.id        → base64url string
        //   registrationInfo.credential.publicKey  → Uint8Array
        //   registrationInfo.credential.counter    → number
        //   registrationInfo.credential.transports → string[]
        const { credential } = verification.registrationInfo;

        user.devices.push({
            credentialID: credential.id,
            credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
            counter: credential.counter || 0,
            transports: credential.transports || req.body.response?.transports || [],
        });

        user.currentChallenge = undefined;
        await user.save();

        res.json({ verified: true, message: 'Device registered successfully.' });

    } catch (error) {
        console.error("Register verify error:", error);
        res.status(500).json({ message: error.message });
    }
};


// AUTH OPTIONS
const authOptions = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (!user.devices.length) {
            return res.status(400).json({
                message: "No biometric device registered"
            });
        }

        const { rpID } = getRPConfig();

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: user.devices.map(device => ({
                id: device.credentialID,
                type: 'public-key',
                transports: device.transports,
            })),
            userVerification: 'required',
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.json(options);

    } catch (error) {
        console.error("Auth options error:", error);
        res.status(500).json({ message: error.message });
    }
};


// AUTH VERIFY
const authVerify = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const { rpID, origin } = getRPConfig();

        const credentialID = req.body.id;

        const device = user.devices.find(d => d.credentialID === credentialID);
        if (!device) {
            return res.status(400).json({ message: 'Device not recognized' });
        }

        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: device.credentialID,
                publicKey: base64urlToUint8Array(device.credentialPublicKey),
                counter: device.counter,
                transports: device.transports,
            },
        });

        if (!verification.verified) {
            return res.status(400).json({ verified: false });
        }

        device.counter = verification.authenticationInfo.newCounter;
        user.currentChallenge = undefined;

        await user.save();

        res.json({ verified: true, message: 'Biometric verified.' });

    } catch (error) {
        console.error("Auth verify error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerOptions,
    registerVerify,
    authOptions,
    authVerify
};