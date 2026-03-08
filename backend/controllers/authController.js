const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Department = require('../models/Department');
const User = require('../models/User');

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required.' });
        }

        let user, userId, departmentId, userName;

        if (role === 'hod') {
            // HOD login — check departments collection
            const dept = await Department.findOne({ email: email.toLowerCase() });
            if (!dept) return res.status(401).json({ message: 'Invalid credentials.' });

            const isMatch = await bcrypt.compare(password, dept.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

            userId = dept._id;
            departmentId = dept._id;
            userName = dept.hodName;
        } else {
            // Teacher or Student login — check users collection
            const foundUser = await User.findOne({ email: email.toLowerCase(), role });
            if (!foundUser) return res.status(401).json({ message: 'Invalid credentials.' });

            const isMatch = await bcrypt.compare(password, foundUser.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

            userId = foundUser._id;
            departmentId = foundUser.departmentId;
            userName = foundUser.name;
            user = foundUser;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId, role, departmentId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                id: userId,
                name: userName,
                email,
                role,
                departmentId,
                hasDevice: role === 'student' && user ? user.devices.length > 0 : undefined
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// POST /api/auth/register-department (seed route for creating initial HOD)
const registerDepartment = async (req, res) => {
    try {
        const { name, code, hodName, email, password } = req.body;

        const existing = await Department.findOne({ $or: [{ email }, { code }] });
        if (existing) return res.status(400).json({ message: 'Department or email already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const dept = await Department.create({
            name, code, hodName, email: email.toLowerCase(), password: hashedPassword
        });

        res.status(201).json({ message: 'Department created.', department: { id: dept._id, name: dept.name, code: dept.code } });
    } catch (error) {
        console.error('Register department error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { login, registerDepartment };
